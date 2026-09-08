"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Question,
  Student,
  createId,
  loadQuestions,
  loadStudents,
  saveQuestions,
} from "@/lib/classroom-data";

type RandomMode = "question" | "question-student";

const emptyQuestion = {
  prompt: "",
  answer: "",
  points: 1,
};

export default function QuestionTool() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [draft, setDraft] = useState(emptyQuestion);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [randomMode, setRandomMode] = useState<RandomMode>("question-student");
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setQuestions(loadQuestions());
      setStudents(loadStudents());
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveQuestions(questions);
    }
  }, [hasLoaded, questions]);

  const canRandomStudent = students.length > 0;

  const currentModeLabel = useMemo(() => {
    if (randomMode === "question-student") {
      return "สุ่มคำถาม + สุ่มชื่อ";
    }

    return "สุ่มเฉพาะคำถาม";
  }, [randomMode]);

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = draft.prompt.trim();
    if (!prompt) {
      return;
    }

    const question = {
      id: createId(),
      prompt,
      answer: draft.answer.trim(),
      points: Math.max(0, Math.round(draft.points || 0)),
    };

    setQuestions((current) => [...current, question]);
    setDraft(emptyQuestion);
    setSelectedQuestion((current) => current ?? question);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...updates } : question,
      ),
    );
    setSelectedQuestion((current) =>
      current?.id === id ? { ...current, ...updates } : current,
    );
  }

  function deleteQuestion(id: string) {
    setQuestions((current) => current.filter((question) => question.id !== id));
    setSelectedQuestion((current) => (current?.id === id ? null : current));
    setShowAnswer(false);
  }

  function pickQuestion() {
    if (questions.length === 0) {
      return null;
    }

    const nextIndex = Math.floor(Math.random() * questions.length);
    return questions[nextIndex];
  }

  function pickStudent() {
    if (students.length === 0) {
      return null;
    }

    const nextIndex = Math.floor(Math.random() * students.length);
    return students[nextIndex];
  }

  function randomize(mode = randomMode) {
    const nextQuestion = pickQuestion();
    if (!nextQuestion) {
      return;
    }

    setSelectedQuestion(nextQuestion);
    setSelectedStudent(mode === "question-student" ? pickStudent() : null);
    setShowAnswer(false);
  }

  function setModeAndRandomize(mode: RandomMode) {
    setRandomMode(mode);
    randomize(mode);
  }

  return (
    <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="flex min-h-0 flex-col gap-4">
        <div className="shrink-0 rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-sm ring-1 ring-slate-800 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-bold text-sky-200">โหมดปัจจุบัน</p>
              <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                {currentModeLabel}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <button
                type="button"
                onClick={() => setRandomMode("question")}
                className={`min-h-14 rounded-2xl px-4 text-lg font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300 ${
                  randomMode === "question"
                    ? "bg-sky-500 text-white"
                    : "bg-white/12 text-white hover:bg-white/20"
                }`}
              >
                เฉพาะคำถาม
              </button>
              <button
                type="button"
                onClick={() => setRandomMode("question-student")}
                className={`min-h-14 rounded-2xl px-4 text-lg font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300 ${
                  randomMode === "question-student"
                    ? "bg-sky-500 text-white"
                    : "bg-white/12 text-white hover:bg-white/20"
                }`}
              >
                คำถาม + ชื่อ
              </button>
              <button
                type="button"
                onClick={() => randomize()}
                disabled={questions.length === 0}
                className="min-h-14 rounded-2xl bg-amber-400 px-4 text-lg font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
                สุ่มถัดไป
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModeAndRandomize("question")}
              disabled={questions.length === 0}
                className="min-h-14 rounded-2xl bg-white px-5 text-xl font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              สุ่มเฉพาะคำถาม
            </button>
            <button
              type="button"
              onClick={() => setModeAndRandomize("question-student")}
              disabled={questions.length === 0 || !canRandomStudent}
                className="min-h-14 rounded-2xl bg-sky-500 px-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              สุ่มคำถาม + สุ่มชื่อ
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit items-center rounded-2xl bg-sky-50 px-5 py-3 text-2xl font-black text-sky-800">
                {selectedQuestion
                  ? `${selectedQuestion.points} คะแนน`
                  : "พร้อมเริ่ม"}
              </div>
              {selectedStudent ? (
                <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-2xl font-black text-emerald-800">
                  ผู้ตอบ: {selectedStudent.name}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex min-h-36 items-center justify-center text-center lg:min-h-48">
              <h2 className="break-words text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {selectedQuestion?.prompt || "เพิ่มคำถาม แล้วกดสุ่มเพื่อเริ่ม"}
              </h2>
            </div>

            <div
              className={`mt-5 rounded-[1.5rem] border px-5 py-4 text-center transition ${
                showAnswer && selectedQuestion
                  ? "border-emerald-200 bg-emerald-50 opacity-100"
                  : "border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <p className="text-lg font-bold text-slate-500">เฉลย</p>
              <p className="mt-2 break-words text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
                {showAnswer && selectedQuestion
                  ? selectedQuestion.answer || "ไม่มีเฉลยที่บันทึกไว้"
                  : "ซ่อนไว้"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid shrink-0 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowAnswer((current) => !current)}
              disabled={!selectedQuestion}
              className="min-h-16 rounded-2xl bg-emerald-600 px-6 text-2xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {showAnswer ? "ซ่อนเฉลย" : "แสดงเฉลย"}
            </button>
            <button
              type="button"
              onClick={() => randomize()}
              disabled={questions.length === 0}
              className="min-h-16 rounded-2xl bg-slate-950 px-6 text-2xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              สุ่มคำถามถัดไป
            </button>
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <form onSubmit={addQuestion} className="flex shrink-0 flex-col gap-2">
          <h2 className="text-3xl font-black">คลังคำถาม</h2>
          <textarea
            value={draft.prompt}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                prompt: event.target.value,
              }))
            }
            placeholder="พิมพ์คำถาม"
            className="min-h-20 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <textarea
            value={draft.answer}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                answer: event.target.value,
              }))
            }
            placeholder="พิมพ์เฉลย"
            className="min-h-16 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <label className="text-xl font-black text-slate-950">
            คะแนน
            <input
              type="number"
              min="0"
              value={draft.points}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  points: Number(event.target.value),
                }))
              }
              className="mt-2 min-h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 text-2xl font-black outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-sky-600 px-7 text-xl font-black text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            เพิ่มคำถาม
          </button>
        </form>

        <div className="mt-4 grid shrink-0 grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-sky-50 px-3 py-4 text-sky-800">
            <p className="text-lg font-bold">คำถาม</p>
            <p className="text-4xl font-black">{questions.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-4 text-emerald-800">
            <p className="text-lg font-bold">นักศึกษา</p>
            <p className="text-4xl font-black">{students.length}</p>
          </div>
        </div>

        {students.length === 0 ? (
          <Link
            href="/students"
            className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-amber-100 px-5 text-lg font-black text-amber-900 transition hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-200"
          >
            เพิ่มรายชื่อสำหรับโหมดสุ่มชื่อ
          </Link>
        ) : null}

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {questions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-2xl font-black text-slate-700">
                ยังไม่มีคำถาม
              </p>
              <p className="mt-2 text-xl font-medium text-slate-500">
                เพิ่มคำถามแรกเพื่อเริ่มสุ่มในชั้นเรียน
              </p>
            </div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <textarea
                  value={question.prompt}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      prompt: event.target.value,
                    })
                  }
                  className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  aria-label="แก้ไขคำถาม"
                />
                <textarea
                  value={question.answer}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      answer: event.target.value,
                    })
                  }
                  placeholder="เฉลย"
                  className="mt-2 min-h-16 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  aria-label="แก้ไขเฉลย"
                />
                <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
                  <input
                    type="number"
                    min="0"
                    value={question.points}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        points: Math.max(
                          0,
                          Math.round(Number(event.target.value) || 0),
                        ),
                      })
                    }
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-lg font-black text-slate-950 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    aria-label="แก้ไขคะแนน"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(question);
                      setShowAnswer(false);
                    }}
                    className="min-h-12 rounded-xl bg-slate-100 px-4 text-lg font-black text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    ใช้
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuestion(question.id)}
                    className="min-h-12 rounded-xl bg-slate-950 px-4 text-lg font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
