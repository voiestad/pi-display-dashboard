"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { YrResponse } from "../types";

function filterTimes(input: YrResponse): YrResponse {
  const copy = { ...input };
  const previousHour = new Date();
  previousHour.setMinutes(0, 0, 0);
  copy.properties.timeseries = copy.properties.timeseries.filter(hour => new Date(hour.time) >= previousHour);
  return copy;
}

export default function Weather() {
  const [weather, setWeather] = useState<null | YrResponse>(null);

  useEffect(() => {
    async function getWeatherData() {
      const res = await fetch("/api/weather");
      if (!res.ok) {
        alert("Noe gikk galt");
        return;
      }
      const data = await res.json();
      setWeather(filterTimes(data));
    }
    setTimeout(getWeatherData, 0);
    const interval = setInterval(getWeatherData, 1000 * 60);
    return () => clearInterval(interval);
  }, [])

  return (
    <div className="text-4xl">
      {weather ? (
        <div className="grid grid-rows-6 grid-flow-col auto-cols-fr gap-4">
          {weather.properties.timeseries.slice(0, 18).map(hour => (
            <div
              className="grid grid-cols-4 items-center border-2 border-neutral-400 bg-neutral-900 p-2 rounded-md"
              key={hour.time}
            >
              <div className="font-semibold">{new Date(hour.time).getHours().toString().padStart(2, "0")}</div>
              <Image
                src={`/weather/${hour.data.next_1_hours.summary.symbol_code}.svg`}
                alt="Værsymbol"
                width={50}
                height={50}
                className="self-center"
              />
              <div className="flex flex-row gap-2 text-blue-500">
                <div>{hour.data.next_1_hours.details.precipitation_amount}</div>
                <div className="text-sm self-end">{weather.properties.meta.units.precipitation_amount}</div>
              </div>
              <div
                className={`${Math.round(hour.data.instant.details.air_temperature) > 0
                    ? "text-red-500"
                    : "text-blue-500"
                  }`}
              >
                {Math.round(hour.data.instant.details.air_temperature)}&deg;
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>Laster...</div>
      )}
    </div>
  );
}
