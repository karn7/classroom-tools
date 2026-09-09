"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TimerStatus = "idle" | "running" | "paused" | "finished";

const PRESET_TIMES = [
  { label: "10 วิ", seconds: 10 },
  { label: "15 วิ", seconds: 15 },
  { label: "30 วิ", seconds: 30 },
  { label: "1 นาที", seconds: 60 },
  { label: "2 นาที", seconds: 120 },
  { label: "3 นาที", seconds: 180 },
  { label: "5 นาที", seconds: 300 },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function TimerTool() {
  const [duration, setDuration] = useState(60);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [customMinutes, setCustomMinutes] = useState("1");
  const [customSeconds, setCustomSeconds] = useState("0");

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setStatus("finished");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const isWarning = status === "running" && remainingSeconds <= 10;
  const progressPercent = useMemo(() => {
    if (duration <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (remainingSeconds / duration) * 100));
  }, [duration, remainingSeconds]);

  function setTimer(seconds: number) {
    const nextSeconds = Math.max(1, Math.round(seconds));
    setDuration(nextSeconds);
    setRemainingSeconds(nextSeconds);
    setStatus("idle");
  }

  function setCustomTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Math.max(0, Math.round(Number(customMinutes) || 0));
    const seconds = Math.max(0, Math.round(Number(customSeconds) || 0));
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds > 0) {
      setTimer(totalSeconds);
    }
  }

  function startTimer() {
    if (remainingSeconds === 0) {
      setRemainingSeconds(duration);
    }
    setStatus("running");
  }

  function pauseTimer() {
    setStatus("paused");
  }

  function resetTimer() {
    setRemainingSeconds(duration);
    setStatus("idle");
  }

  return (
    <section
      className={`flex h-full min-h-0 flex-col gap-4 rounded-[1.5rem] p-5 shadow-sm ring-1 transition sm:p-6 ${
        status === "finished"
          ? "bg-rose-600 text-white ring-rose-700"
          : isWarning
            ? "bg-amber-300 text-slate-950 ring-amber-400"
            : "bg-white text-slate-950 ring-slate-200"
      }`}
    >
      <div className="grid shrink-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-wrap gap-2">
          {PRESET_TIMES.map((preset) => (
            <button
              key={preset.seconds}
              type="button"
              onClick={() => setTimer(preset.seconds)}
              className={`min-h-11 rounded-2xl px-4 text-base font-black transition focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                duration === preset.seconds
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-950 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={setCustomTimer}
          className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl bg-slate-100 p-2"
        >
          <input
            type="number"
            min="0"
            value={customMinutes}
            onChange={(event) => setCustomMinutes(event.target.value)}
            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-base font-black text-slate-950 outline-none focus:ring-4 focus:ring-indigo-200"
            aria-label="กำหนดนาที"
          />
          <input
            type="number"
            min="0"
            max="59"
            value={customSeconds}
            onChange={(event) => setCustomSeconds(event.target.value)}
            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-base font-black text-slate-950 outline-none focus:ring-4 focus:ring-indigo-200"
            aria-label="กำหนดวินาที"
          />
          <button
            type="submit"
            className="min-h-10 rounded-xl bg-slate-950 px-4 text-base font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            ตั้งเวลา
          </button>
        </form>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[1.5rem] bg-slate-950 px-6 py-8 text-center text-white shadow-inner">
        <p
          className={`text-3xl font-black sm:text-5xl ${
            status === "finished"
              ? "text-rose-200"
              : isWarning
                ? "text-amber-200"
                : "text-indigo-200"
          }`}
        >
          {status === "finished"
            ? "หมดเวลา"
            : isWarning
              ? "เหลือ 10 วินาทีสุดท้าย"
              : status === "paused"
                ? "หยุดชั่วคราว"
                : "พร้อมจับเวลา"}
        </p>
        <div
          className={`mt-6 text-[18vw] font-black leading-none tracking-normal sm:text-[15vw] ${
            isWarning || status === "finished" ? "timer-pulse" : ""
          }`}
        >
          {formatTime(remainingSeconds)}
        </div>
        <div className="mt-8 h-5 w-full max-w-5xl overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === "finished"
                ? "bg-rose-400"
                : isWarning
                  ? "bg-amber-300"
                  : "bg-indigo-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={startTimer}
          disabled={status === "running"}
          className="min-h-16 rounded-2xl bg-emerald-600 px-6 text-2xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Start
        </button>
        <button
          type="button"
          onClick={pauseTimer}
          disabled={status !== "running"}
          className="min-h-16 rounded-2xl bg-amber-400 px-6 text-2xl font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={startTimer}
          disabled={status !== "paused"}
          className="min-h-16 rounded-2xl bg-indigo-600 px-6 text-2xl font-black text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Resume
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="min-h-16 rounded-2xl bg-slate-950 px-6 text-2xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
