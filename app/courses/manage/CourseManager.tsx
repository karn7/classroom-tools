"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_BACKGROUND_IMAGE,
  Course,
  createCourseId,
  deleteCourseDataEverywhere,
  loadCoursesData,
  saveCoursesData,
} from "@/lib/classroom-data";

type CourseDraft = {
  code: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  password: string;
};

const emptyCourse: CourseDraft = {
  code: "",
  title: "",
  subtitle: "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
  backgroundImage: "",
  password: "",
};

function resizeImageForCourse(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1600;
        canvas.height = 900;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("ไม่สามารถเตรียมรูปภาพได้"));
          return;
        }

        const sourceRatio = image.width / image.height;
        const targetRatio = canvas.width / canvas.height;
        const sourceWidth =
          sourceRatio > targetRatio ? image.height * targetRatio : image.width;
        const sourceHeight =
          sourceRatio > targetRatio ? image.height : image.width / targetRatio;
        const sourceX = (image.width - sourceWidth) / 2;
        const sourceY = (image.height - sourceHeight) / 2;

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = () => reject(new Error("อ่านรูปภาพไม่สำเร็จ"));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [draft, setDraft] = useState<CourseDraft>(emptyCourse);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      if (cancelled) {
        return;
      }

      setCourses(await loadCoursesData());
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveCoursesData(courses);
    }
  }, [courses, hasLoaded]);

  const previewCourse = useMemo(
    () => ({
      code: draft.code.trim() || "NEW101",
      title: draft.title.trim() || "ชื่อวิชาใหม่",
      subtitle:
        draft.subtitle.trim() || "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
      backgroundImage: draft.backgroundImage.trim() || APP_BACKGROUND_IMAGE,
    }),
    [draft],
  );

  function resetForm() {
    setDraft(emptyCourse);
    setEditingId(null);
  }

  async function uploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพ");
      event.target.value = "";
      return;
    }

    try {
      setMessage("กำลังเตรียมรูปภาพ...");
      const backgroundImage = await resizeImageForCourse(file);
      setDraft((current) => ({ ...current, backgroundImage }));
      setMessage("เพิ่มรูปพื้นหลังแล้ว");
    } catch {
      setMessage("ไม่สามารถใช้รูปนี้ได้ ลองเลือกรูปอื่น");
    } finally {
      event.target.value = "";
    }
  }

  function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = draft.code.trim();
    if (!code) {
      setMessage("กรุณากรอกรหัสวิชา");
      return;
    }

    const courseData = {
      code,
      title: draft.title.trim() || code,
      subtitle:
        draft.subtitle.trim() || "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
      backgroundImage: draft.backgroundImage.trim() || APP_BACKGROUND_IMAGE,
      password: draft.password,
    };

    if (editingId) {
      setCourses((current) =>
        current.map((course) =>
          course.id === editingId ? { ...course, ...courseData } : course,
        ),
      );
      setMessage(`แก้ไขวิชา ${code} แล้ว`);
      resetForm();
      return;
    }

    const baseId = createCourseId(code);
    const duplicateCount = courses.filter((course) =>
      course.id.startsWith(baseId),
    ).length;
    const id = duplicateCount > 0 ? `${baseId}-${duplicateCount + 1}` : baseId;

    setCourses((current) => [...current, { id, ...courseData }]);
    setMessage(`เพิ่มวิชา ${code} แล้ว`);
    resetForm();
  }

  function editCourse(course: Course) {
    setEditingId(course.id);
    setDraft({
      code: course.code,
      title: course.title,
      subtitle: course.subtitle,
      backgroundImage:
        course.backgroundImage === APP_BACKGROUND_IMAGE
          ? ""
          : course.backgroundImage,
      password: course.password,
    });
    setMessage(`กำลังแก้ไข ${course.code}`);
  }

  function deleteCourse(course: Course) {
    if (courses.length <= 1) {
      setMessage("ต้องมีรายวิชาอย่างน้อย 1 วิชา");
      return;
    }

    const confirmed = window.confirm(
      `ลบวิชา ${course.code} และข้อมูลรายชื่อ/คะแนน/คำถามของวิชานี้หรือไม่`,
    );
    if (!confirmed) {
      return;
    }

    deleteCourseDataEverywhere(course.id);
    window.sessionStorage.removeItem(`classroom-tools:course-unlocked:${course.id}`);
    setCourses((current) => current.filter((item) => item.id !== course.id));
    if (editingId === course.id) {
      resetForm();
    }
    setMessage(`ลบวิชา ${course.code} แล้ว`);
  }

  return (
    <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
      <main className="stage-16-9 grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid shrink-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div>
              <p className="text-base font-black text-emerald-700">
                Classroom Tools
              </p>
              <h1 className="mt-1 text-4xl font-black leading-tight">
                จัดการรายวิชา
              </h1>
            </div>
            <Link
              href="/"
              className="grid min-h-11 place-items-center rounded-2xl bg-slate-100 px-4 text-base font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              หน้าเลือกวิชา
            </Link>
          </div>

          <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {courses.map((course) => (
              <article
                key={course.id}
                className="grid min-h-48 overflow-hidden rounded-[1.5rem] bg-slate-950 text-white shadow-sm ring-1 ring-slate-200"
              >
                <div
                  className="min-h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url('${course.backgroundImage}')` }}
                />
                <div className="flex min-h-0 flex-col gap-2 p-4">
                  <div className="min-h-0 flex-1">
                    <p className="text-lg font-black text-amber-200">
                      {course.code}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight">
                      {course.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm font-bold text-white/70">
                      {course.subtitle}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => editCourse(course)}
                      className="min-h-11 rounded-xl bg-white px-3 text-base font-black text-slate-950 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCourse(course)}
                      className="min-h-11 rounded-xl bg-rose-500 px-3 text-base font-black text-white transition hover:bg-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-200"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <section className="relative min-h-36 shrink-0 overflow-hidden rounded-[1.25rem] bg-slate-950 text-white">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-75"
              style={{
                backgroundImage: `url('${previewCourse.backgroundImage}')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/10" />
            <div className="relative flex h-full flex-col justify-end p-4">
              <p className="text-2xl font-black text-amber-200">
                {previewCourse.code}
              </p>
              <h2 className="mt-1 line-clamp-2 text-3xl font-black leading-tight">
                {previewCourse.title}
              </h2>
            </div>
          </section>

          <form
            onSubmit={saveCourse}
            className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="text-3xl font-black">
                {editingId ? "แก้ไขวิชา" : "เพิ่มวิชา"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMessage("");
                  }}
                  className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  ยกเลิก
                </button>
              ) : null}
            </div>

            <input
              value={draft.code}
              onChange={(event) =>
                setDraft((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="รหัสวิชา เช่น BS101"
              className="min-h-12 rounded-2xl border border-slate-300 px-4 text-lg font-black outline-none focus:ring-4 focus:ring-emerald-200"
            />
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="ชื่อวิชา"
              className="min-h-12 rounded-2xl border border-slate-300 px-4 text-lg font-black outline-none focus:ring-4 focus:ring-emerald-200"
            />
            <input
              value={draft.subtitle}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
              placeholder="ข้อความใต้ชื่อวิชา"
              className="min-h-12 rounded-2xl border border-slate-300 px-4 text-lg font-black outline-none focus:ring-4 focus:ring-emerald-200"
            />
            <input
              value={
                draft.backgroundImage.startsWith("data:")
                  ? "รูปที่อัปโหลดไว้"
                  : draft.backgroundImage
              }
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  backgroundImage: event.target.value,
                }))
              }
              placeholder="วาง path รูป เช่น /classroom.png หรือปล่อยว่าง"
              readOnly={draft.backgroundImage.startsWith("data:")}
              className="min-h-12 rounded-2xl border border-slate-300 px-4 text-lg font-black outline-none focus:ring-4 focus:ring-emerald-200"
            />
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="grid min-h-12 cursor-pointer place-items-center rounded-2xl bg-slate-950 px-4 text-base font-black text-white transition hover:bg-slate-800 focus-within:ring-4 focus-within:ring-slate-200">
                อัปโหลดรูปพื้นหลัง
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadBackground}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({ ...current, backgroundImage: "" }))
                }
                className="min-h-12 rounded-2xl bg-slate-100 px-4 text-base font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                ใช้รูปแอพ
              </button>
            </div>
            <input
              type="password"
              value={draft.password}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="รหัสผ่านเข้าวิชา"
              className="min-h-12 rounded-2xl border border-slate-300 px-4 text-lg font-black outline-none focus:ring-4 focus:ring-emerald-200"
            />

            {message ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-black text-emerald-800">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="min-h-14 rounded-2xl bg-emerald-600 px-6 text-xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {editingId ? "บันทึกการแก้ไข" : "บันทึกวิชา"}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}
