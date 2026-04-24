"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BusLine } from "../types";

function formatTime(expected: string, time: Date) {
  const expectedDate = new Date(expected);
  const diffMillis = expectedDate.getTime() - time.getTime();
  const diffMinutes = Math.round(diffMillis / (1000 * 60));
  if (diffMinutes <= 15 && diffMinutes >= 0) {
    return `${diffMinutes} min`;
  }
  return expectedDate.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
}

export default function Bus({ time: date }: { time: Date }) {
  const [busTimes, setBusTimes] = useState<null | BusLine[]>(null);
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {
    async function getBusTimes() {
      const res = await fetch("/api/bus");
      if (!res.ok) {
        setError(true);
        return;
      }
      const newBusTimes = await res.json();
      setBusTimes(newBusTimes);
      setError(false);
    }
    setTimeout(getBusTimes, 0);
    const interval = setInterval(getBusTimes, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col h-full justify-center ${error ? "text-amber-300" : ""}`}>
      {busTimes ? (
        <>
          <div className="grid gap-4 p-1 mt-auto mb-auto">
            <div className="grid gap-4 grid-cols-2">
              {busTimes.map((busLine, index) => (
                <div
                  key={busLine.id}
                  className="grid"
                >
                  <div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent"
                    id={`bus-time-${index}`}
                    popover="auto"
                  >
                    <div
                      className="border-neutral-400 border-4 text-foreground bg-neutral-800 p-10 rounded-xl shadow-xl m-10"
                    >
                      <div className="flex flex-col gap-5">
                        <button
                          className="absolute top-6 right-6 bg-red-600 border-red-300 border-2 rounded-full p-2"
                          popoverTarget={`bus-time-${index}`}
                        >
                          <XIcon className="size-12" />
                        </button>
                        <div className="flex flex-col gap-2">
                          <div className="font-bold text-5xl text-nowrap">
                            {busLine.name} - {busLine.to}
                          </div>
                          <div className="text-4xl">
                            {busLine.stop}
                          </div>
                        </div>
                        <div className="grid gap-4 w-max mx-auto text-5xl font-semibold max-h-96 overflow-hidden">
                          <AnimatePresence initial={false}>
                            {busLine.departures.map(departure => (
                              <motion.div
                                key={departure.departureId}
                                layout="position"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{
                                  opacity: 0,
                                  y: -40,
                                }}
                                transition={{ duration: 1 }}
                                className="grid grid-cols-[auto_auto] items-center gap-4"
                              >
                                <div className="min-w-40">{formatTime(departure.departure.expected, date)}</div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="grid gap-2 border-2 border-neutral-400 p-2 rounded-lg bg-neutral-900"
                    popoverTarget={`bus-time-${index}`}
                  >
                    <div className="gap-0.5">
                      <div className="font-bold text-4xl">{busLine.name} - {busLine.to}</div>
                      <div className="text text-xl text-neutral-400">{busLine.stop}</div>
                    </div>
                    <div className="grid gap-1 w-max mx-auto text-4xl font-semibold max-h-20 overflow-hidden">
                      <AnimatePresence initial={false}>
                        {busLine.departures.slice(0, 2).map(departure => (
                          <motion.div
                            key={departure.departureId}
                            layout="position"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -40 }}
                            transition={{ duration: 1 }}
                            className="grid grid-cols-[auto_auto] items-center gap-2"
                          >
                            <div className="min-w-36">{formatTime(departure.departure.expected, date)}</div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="w-full text-4xl">
          Laster...
        </div>
      )}
    </div>
  );
}
