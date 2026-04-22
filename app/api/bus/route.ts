import { NextResponse } from "next/server";
import config from '@/skyss-config.json';
import { SkyssResponse } from "@/app/types";

const numbers = "0123456789";

const cache: Record<string, { skyss: SkyssResponse, time: Date }> = {};

async function getStopTimes(stop: string): Promise<SkyssResponse> {
  if (cache[stop] && Date.now() - cache[stop].time.getTime() < 15 * 1000) {
    return cache[stop].skyss;
  }
  const res = await fetch(`https://skyss-reise.giantleap.no/v3/stopgroups/NSR%3AStopPlace%3A${stop}`);
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
    if (times.resultCode !== "SUCCESS") {
      continue;
    }
    for (const stop of times.StopGroups[0].Stops) {
      if (stop.RouteDirections === undefined) {
        continue;
      }
      for (const dir of stop.RouteDirections) {
        const routeNum = dir.PublicIdentifier;
        const routes = config.routes.filter((r) => r.name === routeNum);
        if (!routes.length) {
          continue;
        }
        const route = routes[0];
        if (res.filter(routeRes => routeRes.name === route.name && routeRes.to === dir.DirectionName).length) {
          continue;
        }
        if (!route[dir.Direction]) {
          continue;
        }
        const routeRes = {
          name: route.name,
          stop: stop.Description,
          to: dir.DirectionName,
          times: dir.PassingTimes,
        }
        res.push(routeRes);
      }
    }
  }
  return { busTimes: res.sort((a, b) => extractNum(a.name) - extractNum(b.name)) };
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
