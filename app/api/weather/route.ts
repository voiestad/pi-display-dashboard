
import { YrResponse } from "@/app/types";
import { NextResponse } from "next/server";

const LAT = process.env.YR_LAT;
const LON = process.env.YR_LON;
const USER_AGENT = process.env.YR_USER_AGENT || "pi-display-app";

let cache: { yr: YrResponse, time: Date } | null = null;

export async function getWeatherData() {
  if (cache && Date.now() - cache.time.getTime() < 60 * 60 * 1000) {
    return cache.yr;
  }
  const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`,
    {
      headers: { "User-Agent": USER_AGENT },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch weather data: ${res.statusText}`);
  }
  const json = await res.json() as YrResponse;
  cache = { yr: json, time: new Date() };
  return json;
}

export async function GET() {
  try {
    const weatherData = await getWeatherData();
    return NextResponse.json(weatherData);
  } catch (err) {
    console.log(err);
    return NextResponse.json({}, { status: 500 });
  }
}
