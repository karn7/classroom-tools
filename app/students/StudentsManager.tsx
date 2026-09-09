"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Student,
  createId,
  loadStudents,
  saveStudents,
} from "@/lib/classroom-data";

type StudentsManagerProps = {
  courseId?: string;
};

export default function StudentsManager({ courseId }: StudentsManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [newName, setNewName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setStudents(loadStudents(courseId));
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (hasLoaded) {
      saveStudents(students, courseId);
    }
  }, [hasLoaded, students]);

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      return;
    }

    setStudents((current) => [...current, { id: createId(), name }]);
    setNewName("");
  }

  function addBulkNames() {
    const names = bulkNames
      .split(/\n|,/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return;
    }

    setStudents((current) => [
      ...current,
      ...names.map((name) => ({ id: createId(), name })),
    ]);
    setBulkNames("");
  }

  function updateStudent(id: string, name: string) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, name } : student,
      ),
    );
  }

  function deleteStudent(id: string) {
    setStudents((current) => current.filter((student) => student.id !== id));
  }

  function clearStudents() {
    setStudents([]);
  }

  return (
    <section className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="min-h-0 overflow-y-auto rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <h2 className="text-3xl font-black">เพิ่มรายชื่อ</h2>
        <p className="mt-2 text-xl font-medium leading-relaxed text-slate-600">
          รายชื่อนี้จะถูกใช้ร่วมกับวงล้อ กิจกรรมอื่น ๆ และตารางคะแนน
        </p>

        <form onSubmit={addStudent} className="mt-5 flex flex-col gap-3">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="พิมพ์ชื่อนักศึกษา"
            className="min-h-16 rounded-2xl border border-slate-300 bg-white px-5 text-2xl font-bold outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="min-h-16 rounded-2xl bg-emerald-600 px-7 text-2xl font-black text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            เพิ่มชื่อ
          </button>
        </form>

        <div className="mt-6">
          <label
            htmlFor="bulk-names"
            className="text-2xl font-black text-slate-950"
          >
            เพิ่มหลายชื่อ
          </label>
          <textarea
            id="bulk-names"
            value={bulkNames}
            onChange={(event) => setBulkNames(event.target.value)}
            placeholder="วางรายชื่อทีละบรรทัด หรือคั่นด้วยเครื่องหมาย comma"
            className="mt-3 min-h-44 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-xl font-bold outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={addBulkNames}
            className="mt-3 min-h-14 w-full rounded-2xl bg-slate-950 px-6 text-xl font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            เพิ่มรายชื่อชุดนี้
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-black">รายชื่อทั้งหมด</h2>
            <p className="mt-1 text-xl font-bold text-slate-500">
              {students.length} คน
            </p>
          </div>
          <button
            type="button"
            onClick={clearStudents}
            disabled={students.length === 0}
            className="min-h-12 rounded-2xl bg-rose-600 px-5 text-lg font-black text-white transition hover:bg-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            ล้างทั้งหมด
          </button>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {students.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-2xl font-black text-slate-700">
                ยังไม่มีรายชื่อนักศึกษา
              </p>
              <p className="mt-2 text-xl font-medium text-slate-500">
                เพิ่มชื่อเพื่อให้วงล้อและตารางคะแนนนำไปใช้ได้
              </p>
            </div>
          ) : (
            students.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg font-black text-emerald-800">
                  {index + 1}
                </span>
                <input
                  value={student.name}
                  onChange={(event) =>
                    updateStudent(student.id, event.target.value)
                  }
                  className="min-h-14 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-xl font-bold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  aria-label={`แก้ไขชื่อ ${student.name}`}
                />
                <button
                  type="button"
                  onClick={() => deleteStudent(student.id)}
                  className="min-h-14 rounded-xl bg-slate-950 px-4 text-lg font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
