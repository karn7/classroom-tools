"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Student,
  loadScoreMap,
  loadStudents,
  saveScoreMap,
} from "@/lib/classroom-data";

export default function Scoreboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setStudents(loadStudents());
      setScores(loadScoreMap());
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveScoreMap(scores);
    }
  }, [hasLoaded, scores]);

  const rows = useMemo(
    () =>
      students
        .map((student) => ({
          ...student,
          score: scores.get(student.id) ?? 0,
        }))
        .sort((first, second) => second.score - first.score),
    [scores, students],
  );

  function changeScore(studentId: string, amount: number) {
    setScores((current) => {
      const next = new Map(current);
      next.set(studentId, (next.get(studentId) ?? 0) + amount);
      return next;
    });
  }

  function resetScores() {
    setScores(new Map());
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">ตารางคะแนนจากรายชื่อกลาง</h2>
          <p className="mt-2 text-xl font-medium text-slate-600">
            เพิ่มรายชื่อที่หน้ารายชื่อนักศึกษา แล้วคะแนนจะตามรายชื่อนั้น
          </p>
        </div>
        <button
          type="button"
          onClick={resetScores}
          disabled={scores.size === 0}
          className="min-h-14 rounded-2xl bg-rose-600 px-6 text-xl font-black text-white transition hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          รีเซ็ตคะแนน
        </button>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="text-2xl font-black text-slate-700">
              ยังไม่มีรายชื่อสำหรับตารางคะแนน
            </p>
            <Link
              href="/students"
              className="mt-5 inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-950 px-6 text-xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              ไปเพิ่มรายชื่อ
            </Link>
          </div>
        ) : (
          rows.map((student, index) => (
            <div
              key={student.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[72px_minmax(0,1fr)_220px_180px] sm:items-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-2xl font-black text-yellow-800">
                {index + 1}
              </div>
              <p className="break-words text-2xl font-black text-slate-950 sm:text-3xl">
                {student.name}
              </p>
              <div className="text-left sm:text-center">
                <p className="text-sm font-bold text-slate-500">คะแนน</p>
                <p className="text-5xl font-black text-slate-950">
                  {student.score}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => changeScore(student.id, -1)}
                  className="min-h-14 rounded-2xl bg-slate-200 text-3xl font-black text-slate-950 transition hover:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  aria-label={`ลดคะแนน ${student.name}`}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => changeScore(student.id, 1)}
                  className="min-h-14 rounded-2xl bg-emerald-600 text-3xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  aria-label={`เพิ่มคะแนน ${student.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
