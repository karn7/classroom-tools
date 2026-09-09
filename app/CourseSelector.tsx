"use client";

import { useEffect, useState } from "react";
import { Course, loadCoursesData } from "@/lib/classroom-data";
import { unlockCourseSession } from "@/components/CourseAccess";

export default function CourseSelector() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [passwordByCourse, setPasswordByCourse] = useState<
    Record<string, string>
  >({});
  const [errorByCourse, setErrorByCourse] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      if (cancelled) {
        return;
      }

      setCourses(await loadCoursesData());
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function updatePassword(courseId: string, password: string) {
    setPasswordByCourse((current) => ({ ...current, [courseId]: password }));
    setErrorByCourse((current) => ({ ...current, [courseId]: "" }));
  }

  function unlockCourse(course: Course) {
    if ((passwordByCourse[course.id] ?? "") !== course.password) {
      setErrorByCourse((current) => ({
        ...current,
        [course.id]: "รหัสผ่านไม่ถูกต้อง",
      }));
      return;
    }

    unlockCourseSession(course.id);
    window.location.href = `/courses/${course.id}`;
  }

  return (
    <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
      <main className="stage-16-9 p-4">
        <section className="flex h-full min-h-0 flex-col rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="shrink-0">
            <p className="text-lg font-black text-emerald-700">
              Classroom Tools
            </p>
            <h1 className="mt-2 text-5xl font-black leading-tight">
              เลือกวิชา
            </h1>
          </div>

          <div className="mt-5 grid min-h-0 flex-1 content-start gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-slate-950 text-white shadow-sm ring-1 ring-slate-200"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${course.backgroundImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5" />
                <div className="relative flex h-full flex-col justify-end p-4">
                  <p className="text-base font-black text-amber-200">
                    {course.code}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight lg:text-2xl">
                    {course.title}
                  </h2>
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <input
                      type="password"
                      value={passwordByCourse[course.id] ?? ""}
                      onChange={(event) =>
                        updatePassword(course.id, event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          unlockCourse(course);
                        }
                      }}
                      placeholder="รหัสผ่าน"
                      className="min-h-11 rounded-xl border border-white/20 bg-white px-3 text-base font-black text-slate-950 outline-none focus:ring-4 focus:ring-amber-200"
                    />
                    <button
                      type="button"
                      onClick={() => unlockCourse(course)}
                      className="min-h-11 rounded-xl bg-amber-400 px-4 text-base font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200"
                    >
                      เข้า
                    </button>
                  </div>
                  {errorByCourse[course.id] ? (
                    <p className="mt-2 text-sm font-bold text-rose-200">
                      {errorByCourse[course.id]}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
