"use client";

import { ReactNode, useEffect, useState } from "react";
import Bus from "@/app/components/bus";
import Weather from "./components/weather";
import { RefreshCwIcon } from "lucide-react";

type Tab = "bus" | "weather";

function TabSelector({ children, selectedTab, setSelectedTab, tab }: { children: ReactNode, setSelectedTab: (tab: Tab) => void, selectedTab: Tab, tab: Tab }) {
  return (
    <button
      onClick={() => {
        setSelectedTab(tab)
        if (tab !== "bus") {
          setTimeout(() => setSelectedTab("bus"), 1000 * 60);
        }
      }}
      className={`text-2xl px-10 py-2 rounded-md border-[3px] font-semibold ${tab === selectedTab ? "bg-neutral-500 border-sky-300" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
    >
      {children}
    </button>
  )
}

function Page({ selectedTab, time }: { selectedTab: Tab, time: Date }) {
  switch (selectedTab) {
    case "bus":
      return <Bus time={time} />;
    case "weather":
      return <Weather />;
  }
}

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<Tab>("bus");
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-row justify-center h-screen w-screen">
      <div className="flex flex-col justify-between w-screen p-2">
        <div className="flex flex-row justify-between">
          <div className="text-3xl font-bold px-1 py-1">{time.toLocaleTimeString("nb-NO")}</div>
          <button
            onClick={() => { window.location.reload() }}
          >
            <RefreshCwIcon className="stroke-3 text-neutral-400" />
          </button>
        </div>
        <div className="flex flex-col justify-center flex-1 text-center">
          <Page selectedTab={selectedTab} time={time} />
        </div>
        <div className="flex flex-row justify-center gap-8 p-2">
          <TabSelector tab="bus" selectedTab={selectedTab} setSelectedTab={setSelectedTab}>
            Buss
          </TabSelector>
          <TabSelector tab="weather" selectedTab={selectedTab} setSelectedTab={setSelectedTab}>
            Vær
          </TabSelector>
        </div>
      </div>
    </div>
  );
}
