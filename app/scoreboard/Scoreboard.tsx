"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Student,
  loadScoreMap,
  loadStudents,
  saveScoreMap,
} from "@/lib/classroom-data";

type ScoreboardProps = {
  courseId?: string;
};

export default function Scoreboard({ courseId }: ScoreboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [pendingScores, setPendingScores] = useState<Map<string, number>>(
    new Map(),
  );
  const [showAllScores, setShowAllScores] = useState(false);
  const [showScoreEditor, setShowScoreEditor] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setStudents(loadStudents(courseId));
      setScores(loadScoreMap(courseId));
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (hasLoaded) {
      saveScoreMap(scores, courseId);
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

  function changePendingScore(studentId: string, amount: number) {
    setPendingScores((current) => {
      const next = new Map(current);
      const nextScore = (next.get(studentId) ?? 0) + amount;
      if (nextScore === 0) {
        next.delete(studentId);
      } else {
        next.set(studentId, nextScore);
      }
      return next;
    });
  }

  function savePendingScores() {
    setScores((current) => {
      const next = new Map(current);
      pendingScores.forEach((score, studentId) => {
        next.set(studentId, (next.get(studentId) ?? 0) + score);
      });
      return next;
    });
    setPendingScores(new Map());
  }

  function resetScores() {
    setScores(new Map());
    setPendingScores(new Map());
  }

  const firstPlace = rows[0];
  const secondPlace = rows[1];
  const thirdPlace = rows[2];
  const otherRows = rows.slice(3);
  const alphabeticalRows = useMemo(
    () =>
      [...rows].sort((first, second) =>
        first.name.localeCompare(second.name, "th"),
      ),
    [rows],
  );
  const totalPendingScore = useMemo(
    () =>
      Array.from(pendingScores.values()).reduce(
        (total, score) => total + score,
        0,
      ),
    [pendingScores],
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">ตารางคะแนนรายบุคคล</h2>
          <p className="mt-1 text-base font-bold text-slate-500">
            {rows.length} รายชื่อ
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAllScores((current) => !current)}
            className="min-h-11 rounded-2xl bg-yellow-400 px-5 text-base font-black text-slate-950 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200"
          >
            {showAllScores ? "ซ่อนคะแนน" : "แสดงคะแนน"}
          </button>
          <button
            type="button"
            onClick={() => setShowScoreEditor((current) => !current)}
            className="min-h-11 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            {showScoreEditor ? "ซ่อนเพิ่มคะแนน" : "เพิ่มคะแนน"}
          </button>
          {showScoreEditor ? (
            <button
              type="button"
              onClick={savePendingScores}
              disabled={pendingScores.size === 0}
              className="min-h-11 rounded-2xl bg-slate-950 px-5 text-base font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              บันทึกคะแนน
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetScores}
            disabled={scores.size === 0}
            className="min-h-11 rounded-2xl bg-rose-600 px-5 text-base font-black text-white transition hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            รีเซ็ต
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
            <div>
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
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-rows-[1fr_0.82fr_1.25fr] gap-3">
            {firstPlace ? (
              <div className="flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-yellow-100 to-amber-50 p-4 text-center ring-1 ring-yellow-200">
                <div>
                  <p className="text-lg font-black text-yellow-700">
                    อันดับ 1
                  </p>
                  <h3 className="mt-1 break-words text-5xl font-black leading-tight text-slate-950 sm:text-6xl lg:text-7xl">
                    {firstPlace.name}
                  </h3>
                  <p className="mt-2 text-4xl font-black text-yellow-800">
                    {firstPlace.score} คะแนน
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid min-h-0 gap-3 sm:grid-cols-2">
              {[secondPlace, thirdPlace].map((student, index) =>
                student ? (
                  <div
                    key={student.id}
                    className="flex items-center justify-center rounded-[1.5rem] bg-slate-50 p-4 text-center ring-1 ring-slate-200"
                  >
                    <div>
                      <p className="text-base font-black text-slate-500">
                        อันดับ {index + 2}
                      </p>
                      <h3 className="mt-1 break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                        {student.name}
                      </h3>
                      <p className="mt-2 text-3xl font-black text-slate-700">
                        {student.score} คะแนน
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty-${index}`}
                    className="rounded-[1.5rem] border-2 border-dashed border-slate-200"
                  />
                ),
              )}
            </div>

            <div className="min-h-0 overflow-y-auto rounded-[1.5rem] bg-slate-50 p-3 ring-1 ring-slate-200">
              {showScoreEditor ? (
                <>
                  <div className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-black text-emerald-800">
                    คะแนนที่จะบันทึก: {totalPendingScore}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {alphabeticalRows.map((student) => {
                      const pendingScore = pendingScores.get(student.id) ?? 0;

                      return (
                        <div
                          key={student.id}
                          className="grid grid-cols-[minmax(0,1fr)_92px_92px] items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm"
                        >
                          <p className="truncate text-lg font-black text-slate-950">
                            {student.name}
                          </p>
                          <p className="text-right text-xl font-black text-emerald-700">
                            +{pendingScore}
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              type="button"
                              onClick={() => changePendingScore(student.id, -1)}
                              className="min-h-9 rounded-xl bg-slate-200 text-xl font-black text-slate-950 transition hover:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
                              aria-label={`ลดคะแนนที่จะเพิ่มให้ ${student.name}`}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => changePendingScore(student.id, 1)}
                              className="min-h-9 rounded-xl bg-emerald-600 text-xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                              aria-label={`เพิ่มคะแนนที่จะเพิ่มให้ ${student.name}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : showAllScores ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {otherRows.map((student, index) => (
                    <div
                      key={student.id}
                      className="grid grid-cols-[44px_minmax(0,1fr)_92px] items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-base font-black text-yellow-800">
                        {index + 4}
                      </span>
                      <p className="truncate text-lg font-black text-slate-950">
                        {student.name}
                      </p>
                      <p className="text-right text-xl font-black text-slate-950">
                        {student.score}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {otherRows.map((student) => (
                    <div
                      key={student.id}
                      className="rounded-2xl bg-white px-4 py-3 text-xl font-black text-slate-800 shadow-sm"
                    >
                      {student.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
