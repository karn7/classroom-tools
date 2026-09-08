"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Student,
  createId,
  loadStudents,
  normalizeStudents,
  saveStudents,
} from "@/lib/classroom-data";

const LEGACY_STORAGE_KEY = "classroom-tools:name-wheel";
const REMOVED_IDS_STORAGE_KEY = "classroom-tools:name-wheel:removed-ids";
const WHEEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

function loadWheelStudents() {
  if (typeof window === "undefined") {
    return [];
  }

  const students = loadStudents();
  if (students.length > 0) {
    return students;
  }

  const legacySaved = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacySaved) {
    return students;
  }

  try {
    const migratedStudents = normalizeStudents(JSON.parse(legacySaved));
    saveStudents(migratedStudents);
    return migratedStudents;
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return [];
  }
}

function loadRemovedIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  const saved = window.localStorage.getItem(REMOVED_IDS_STORAGE_KEY);
  if (!saved) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(saved) as string[];
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    window.localStorage.removeItem(REMOVED_IDS_STORAGE_KEY);
    return new Set<string>();
  }
}

function buildWheelBackground(count: number) {
  if (count <= 0) {
    return "conic-gradient(#e2e8f0 0deg 360deg)";
  }

  const slice = 360 / count;
  const stops = Array.from({ length: count }, (_, index) => {
    const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
    return `${color} ${index * slice}deg ${(index + 1) * slice}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export default function NameWheel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setStudents(loadWheelStudents());
      setRemovedIds(loadRemovedIds());
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLoaded && typeof window !== "undefined") {
      saveStudents(students);
    }
  }, [hasLoaded, students]);

  useEffect(() => {
    if (hasLoaded && typeof window !== "undefined") {
      window.localStorage.setItem(
        REMOVED_IDS_STORAGE_KEY,
        JSON.stringify(Array.from(removedIds)),
      );
    }
  }, [hasLoaded, removedIds]);

  const activeStudents = useMemo(
    () => students.filter((student) => !removedIds.has(student.id)),
    [removedIds, students],
  );
  const removedStudents = students.length - activeStudents.length;
  const wheelBackground = buildWheelBackground(activeStudents.length);

  function addName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      return;
    }

    setStudents((current) => [
      ...current,
      {
        id: createId(),
        name,
      },
    ]);
    setNewName("");
  }

  function updateName(id: string, name: string) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, name } : student,
      ),
    );
    setWinner((current) => (current?.id === id ? { ...current, name } : current));
  }

  function deleteName(id: string) {
    setStudents((current) => current.filter((student) => student.id !== id));
    setRemovedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setWinner((current) => (current?.id === id ? null : current));
  }

  function restoreAll() {
    setRemovedIds(new Set());
    setWinner(null);
  }

  function removeWinner() {
    if (!winner) {
      return;
    }

    setRemovedIds((current) => new Set(current).add(winner.id));
    setWinner(null);
  }

  function spinWheel() {
    if (isSpinning || activeStudents.length === 0) {
      return;
    }

    const winnerIndex = Math.floor(Math.random() * activeStudents.length);
    const degreesPerSlice = 360 / activeStudents.length;
    const targetAngle = winnerIndex * degreesPerSlice + degreesPerSlice / 2;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const nextRotation = rotation + extraTurns * 360 + (360 - targetAngle);

    setWinner(null);
    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setWinner(activeStudents[winnerIndex]);
      setIsSpinning(false);
    }, 3800);
  }

  return (
    <section className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <div className="min-h-0 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex h-full min-h-0 flex-col items-center gap-4">
          <div className="relative flex aspect-square min-h-0 flex-1 items-center justify-center">
            <div className="absolute -right-1 top-1/2 z-10 h-0 w-0 -translate-y-1/2 border-y-[22px] border-r-[40px] border-y-transparent border-r-slate-950 drop-shadow" />
            <div
              className="relative h-full w-full rounded-full border-[14px] border-white shadow-2xl ring-1 ring-slate-200 transition-transform duration-[3800ms] ease-out"
              style={{
                background: wheelBackground,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <div className="absolute inset-[12%] rounded-full bg-white/95 shadow-inner" />
              <div className="absolute inset-[33%] rounded-full bg-slate-950 shadow-lg" />
            </div>
            <div className="pointer-events-none absolute inset-[22%] flex items-center justify-center text-center">
              <div>
                <p className="text-xl font-bold text-slate-500 sm:text-2xl">
                  รายชื่อในวงล้อ
                </p>
                <p className="mt-2 text-6xl font-black text-slate-950 sm:text-8xl">
                  {activeStudents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={spinWheel}
              disabled={isSpinning || activeStudents.length === 0}
              className="min-h-14 rounded-2xl bg-rose-600 px-5 text-xl font-black text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSpinning ? "กำลังหมุน..." : "หมุนวงล้อ"}
            </button>
            <button
              type="button"
              onClick={removeWinner}
              disabled={!winner}
              className="min-h-14 rounded-2xl bg-slate-950 px-5 text-base font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              ลบชื่อนี้ออกจากวงล้อ
            </button>
            <button
              type="button"
              onClick={restoreAll}
              disabled={students.length === 0 || removedStudents === 0}
              className="min-h-14 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              คืนรายชื่อทั้งหมด
            </button>
          </div>

          <div className="w-full shrink-0 rounded-[1.5rem] bg-slate-950 px-5 py-4 text-center text-white">
            <p className="text-base font-semibold text-rose-200 sm:text-xl">
              ผลการสุ่ม
            </p>
            <p className="mt-1 break-words text-3xl font-black leading-tight sm:text-5xl">
              {winner?.name || "พร้อมสุ่มชื่อ"}
            </p>
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <form onSubmit={addName} className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="พิมพ์ชื่อนักศึกษา"
            className="min-h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-xl font-bold outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-rose-600 px-6 text-xl font-black text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-200"
          >
            เพิ่ม
          </button>
        </form>

        <div className="mt-4 grid shrink-0 grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-slate-100 px-3 py-3">
            <p className="text-sm font-bold text-slate-500">ทั้งหมด</p>
            <p className="text-3xl font-black">{students.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-emerald-800">
            <p className="text-sm font-bold">ในวงล้อ</p>
            <p className="text-3xl font-black">{activeStudents.length}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 px-3 py-3 text-rose-800">
            <p className="text-sm font-bold">ถูกลบ</p>
            <p className="text-3xl font-black">{removedStudents}</p>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {students.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-2xl font-black text-slate-700">
                ยังไม่มีรายชื่อ
              </p>
              <p className="mt-2 text-xl font-medium text-slate-500">
                เพิ่มชื่อแรกเพื่อเริ่มใช้วงล้อ
              </p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  !removedIds.has(student.id)
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-100 opacity-60"
                }`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded-full ${
                    !removedIds.has(student.id)
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                  aria-hidden="true"
                />
                <input
                  value={student.name}
                  onChange={(event) =>
                    updateName(student.id, event.target.value)
                  }
                  className="min-h-14 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-xl font-bold text-slate-950 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  aria-label={`แก้ไขชื่อ ${student.name}`}
                />
                <button
                  type="button"
                  onClick={() => deleteName(student.id)}
                  className="min-h-14 rounded-xl bg-slate-950 px-4 text-lg font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
