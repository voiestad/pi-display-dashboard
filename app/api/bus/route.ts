import { NextResponse } from "next/server";
import config from '@/skyss-config.json';
import { BusLine, SkyssResponse, SkyssResponse2 } from "@/app/types";



const numbers = "0123456789";

const departureCache: Record<string, { skyss: SkyssResponse, time: Date }> = {};
const busLineCache: Record<string, BusLine[]> = {};

const extendedStopPlaceQuery = `query stopPlace_v3_extended(
  $id: String!,
  $startTime: DateTime
) {
  stopPlace_v3(
    id: $id
    numberOfDeparturesPerLineAndDestinationDisplay: 6
    startTime: $startTime
  ) {
    id
    name
    platforms {
      __typename
      ... on PlatformWithoutDepartures {
        id
        publicCode
      }
      ... on PlatformWithDepartures {
        id
        publicCode
        lineDepartures {
          departures {
            departureId
            departure {
              aimed
              expected
            }
            transitState
          }
          line {
            id
            publicCode
            name
            frontText
            direction
          }
        }
      }
    }
  }
}`;

const stopPlaceQuery = `query stopPlace_v3($id: String!, $startTime: DateTime) {
  stopPlace_v3(
    id: $id
    numberOfDeparturesPerLineAndDestinationDisplay: 1
    startTime: $startTime
  ) {
    id
    name
    platforms {
      __typename
      ... on PlatformWithoutDepartures {
        id
        publicCode
      }
      ... on PlatformWithDepartures {
        id
        publicCode
        lineDepartures {
          line {
            id
            publicCode
            name
            frontText
            direction
          }
        }
      }
    }
  }
}`;


function getExtendedStopPlaceQuery(stop: string) {
  return {
    "query": extendedStopPlaceQuery, "variables": { "id": `NSR:StopPlace:${stop}` }, "operationName": "stopPlace_v3_extended"
  };
}

function getStopPlaceQuery(stop: string) {
  return {
    "query": stopPlaceQuery, "variables": { "id": `NSR:StopPlace:${stop}` }, "operationName": "stopPlace_v3"
  };
}

async function getStopTimes(stop: string): Promise<SkyssResponse> {
  if (departureCache[stop] && Date.now() - departureCache[stop].time.getTime() < 15 * 1000) {
    return departureCache[stop].skyss;
  }
  const res = await fetch(`https://skyss-api.transhub.io/graphql`,
    {
      method: "POST",
      body: JSON.stringify(getExtendedStopPlaceQuery(stop)),
      headers: {
        "client-platform": "web",
        "client-version": "1.0.1",
      }
    }
  );
  if (!res.ok) {
    console.log(await res.json());
    throw new Error(`Failed to get Skyss times for stop: ${stop}`);
  }
  const json = await res.json() as SkyssResponse;
  departureCache[stop] = { skyss: json, time: new Date() };
  return json;
}

function extractNum(a: string): number {
  const A: string[] = [];
  for (const v of a) {
    if (numbers.includes(v)) {
      A.push(v);
    }
  }
  if (A.length === 0) {
    return 0;
  }
  return parseInt(A.join(""));
}

async function getBusLines(stop: string) {
  const res = await fetch(`https://skyss-api.transhub.io/graphql`,
    {
      method: "POST",
      body: JSON.stringify(getStopPlaceQuery(stop)),
      headers: {
        "client-platform": "web",
        "client-version": "1.0.1",
      }
    }
  );
  if (!res.ok) {
    console.log(await res.json());
    throw new Error(`Failed to get Skyss bus lines for stop: ${stop}`);
  }
  const json = await res.json() as SkyssResponse2;
  const busLines: BusLine[] = [];
  for (const platform of json.data.stopPlace_v3.platforms) {
    if (!platform.lineDepartures) {
      continue;
    }
    for (const lineDepartures of platform.lineDepartures) {
      const routeNum = lineDepartures.line.publicCode;
      const routes = config.routes.filter((r) => r.name === routeNum);
      if (!routes.length) {
        continue;
      }
      const route = routes[0];
      const direction = lineDepartures.line.direction;
      if (!route[direction]) {
        continue;
      }
      const busLine: BusLine = {
        id: lineDepartures.line.id,
        name: routeNum,
        stop: json.data.stopPlace_v3.name,
        to: lineDepartures.line.frontText,
        departures: [],
      }
      busLines.push(busLine);
    }
  }
  busLineCache[stop] = busLines;
  return json;
}

function getExpectedLength() {
  return config.routes
    .map((route) => (route.inbound ? 1 : 0) + (route.outbound ? 1 : 0))
    .reduce((total, current) => total + current, 0);
}

export async function getBusTimes() {
  const res = [];
  for (const busStop of config.stops) {
    if (!busLineCache[busStop]) {
      await getBusLines(busStop);
    }
    const times = await getStopTimes(busStop);
    for (const platform of times.data.stopPlace_v3.platforms) {
      if (!platform.lineDepartures) {
        continue;
      }
      for (const lineDepartures of platform.lineDepartures) {
        const routeNum = lineDepartures.line.publicCode;
        const routes = config.routes.filter((r) => r.name === routeNum);
        if (!routes.length) {
          continue;
        }
        const route = routes[0];
        const direction = lineDepartures.line.direction;
        if (res.filter(routeRes => routeRes.name === route.name && routeRes.to === lineDepartures.line.frontText).length) {
          continue;
        }
        if (!route[direction]) {
          continue;
        }
        const routeRes: BusLine = {
          id: lineDepartures.line.id,
          name: routeNum,
          stop: times.data.stopPlace_v3.name,
          to: lineDepartures.line.frontText,
          departures: lineDepartures.departures,
        }
        res.push(routeRes);
      }
    }
  }
  if (getExpectedLength() > res.length) {
    for (const busStop of config.stops) {
      if (!busLineCache[busStop]) {
        continue;
      }
      for (const busLine of busLineCache[busStop]) {
        if (!res.filter(routeRes => routeRes.id === busLine.id).length) {
          res.push(busLine);
        }
      }
    }
  }
  return res.sort((a, b) => extractNum(a.name) - extractNum(b.name));
}

export async function GET() {
  try {
    const busTimes = await getBusTimes();
    return NextResponse.json(busTimes);
  } catch (err) {
    console.log(err);
    return NextResponse.json({}, { status: 500 });
  }
}
