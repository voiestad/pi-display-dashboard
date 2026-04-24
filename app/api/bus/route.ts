import { NextResponse } from "next/server";
import config from '@/skyss-config.json';
import { SkyssResponse } from "@/app/types";



const numbers = "0123456789";

const cache: Record<string, { skyss: SkyssResponse, time: Date }> = {};

const query = `query stopPlace_v3_extended(
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


function getQuery(stop: string) {
  return {
    "query": query, "variables": { "id": `NSR:StopPlace:${stop}` }, "operationName": "stopPlace_v3_extended"
  };
}

async function getStopTimes(stop: string): Promise<SkyssResponse> {
  if (cache[stop] && Date.now() - cache[stop].time.getTime() < 15 * 1000) {
    return cache[stop].skyss;
  }
  const res = await fetch(`https://skyss-api.transhub.io/graphql`,
    {
      method: "POST",
      body: JSON.stringify(getQuery(stop)),
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
  cache[stop] = { skyss: json, time: new Date() };
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

export async function getBusTimes() {
  const res = [];
  for (const busStop of config.stops) {
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
        const routeRes = {
          id: lineDepartures.line.id,
          name: route.name,
          stop: times.data.stopPlace_v3.name,
          to: lineDepartures.line.frontText,
          departures: lineDepartures.departures,
        }
        res.push(routeRes);
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
