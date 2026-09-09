"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CourseDashboard from "@/components/CourseDashboard";
import { isCourseUnlocked, unlockCourseSession } from "@/components/CourseAccess";
import { Course, loadCoursesData } from "@/lib/classroom-data";

type CourseDashboardLoaderProps = {
  courseId: string;
};

export default function CourseDashboardLoader({
  courseId,
}: CourseDashboardLoaderProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      const courses = await loadCoursesData();
      if (cancelled) {
        return;
      }

      setCourse(courses.find((item) => item.id === courseId) ?? null);
      setIsUnlocked(isCourseUnlocked(courseId));
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function submitPassword() {
    if (!course) {
      return;
    }

    if (password !== course.password) {
      setError("รหัสผ่านไม่ถูกต้อง");
      return;
    }

    unlockCourseSession(courseId);
    setIsUnlocked(true);
    setError("");
  }

  if (!hasLoaded) {
    return <div className="stage-viewport bg-slate-950" />;
  }

  if (!course) {
    return (
      <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
        <main className="stage-16-9 flex items-center justify-center p-6">
          <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-4xl font-black">ไม่พบวิชา</h1>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-950 px-6 text-xl font-black text-white"
            >
              กลับหน้าเลือกวิชา
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
        <main className="stage-16-9 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-[1.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-xl font-black text-amber-700">{course.code}</p>
            <h1 className="mt-2 text-4xl font-black">{course.title}</h1>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitPassword();
                }
              }}
              placeholder="รหัสผ่านเข้าวิชา"
              className="mt-6 min-h-14 w-full rounded-2xl border border-slate-300 px-5 text-xl font-black outline-none focus:ring-4 focus:ring-amber-200"
            />
            {error ? (
              <p className="mt-3 text-base font-bold text-rose-600">{error}</p>
            ) : null}
            <button
              type="button"
              onClick={submitPassword}
              className="mt-4 min-h-14 w-full rounded-2xl bg-slate-950 px-6 text-xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              เข้าสู่วิชา
            </button>
            <Link
              href="/"
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-base font-black text-slate-950"
            >
              กลับหน้าเลือกวิชา
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <CourseDashboard course={course} />;
}
