"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Question,
  Student,
  createId,
  loadQuestionsData,
  loadScoreMapData,
  loadStudentsData,
  saveQuestionsData,
  saveScoreMapData,
} from "@/lib/classroom-data";

type RandomMode = "question" | "question-student";

const emptyQuestion = {
  prompt: "",
  answer: "",
  points: 1,
};

type QuestionToolProps = {
  courseId?: string;
};

export default function QuestionTool({ courseId }: QuestionToolProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [pendingScores, setPendingScores] = useState<Map<string, number>>(
    new Map(),
  );
  const [draft, setDraft] = useState(emptyQuestion);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [randomMode, setRandomMode] = useState<RandomMode>("question-student");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(async () => {
      if (cancelled) {
        return;
      }

      const [loadedQuestions, loadedStudents, loadedScores] =
        await Promise.all([
          loadQuestionsData(courseId),
          loadStudentsData(courseId),
          loadScoreMapData(courseId),
        ]);

      setQuestions(loadedQuestions);
      setStudents(loadedStudents);
      setScores(loadedScores);
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (hasLoaded) {
      saveQuestionsData(questions, courseId);
    }
  }, [hasLoaded, questions]);

  useEffect(() => {
    if (hasLoaded) {
      saveScoreMapData(scores, courseId);
    }
  }, [hasLoaded, scores]);

  const canRandomStudent = students.length > 0;

  const currentModeLabel = useMemo(() => {
    if (randomMode === "question-student") {
      return "สุ่มคำถาม + สุ่มชื่อ";
    }

    return "สุ่มเฉพาะคำถาม";
  }, [randomMode]);

  const alphabeticalRows = useMemo(
    () =>
      [...students].sort((first, second) =>
        first.name.localeCompare(second.name, "th"),
      ),
    [students],
  );
  const totalPendingScore = useMemo(
    () =>
      Array.from(pendingScores.values()).reduce(
        (total, score) => total + score,
        0,
      ),
    [pendingScores],
  );

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

  function addPendingScore(
    studentId: string,
    points = selectedQuestion?.points ?? 0,
  ) {
    const amount = Math.max(0, Math.round(points));
    if (amount === 0) {
      return;
    }

    setPendingScores((current) => {
      const next = new Map(current);
      next.set(studentId, (next.get(studentId) ?? 0) + amount);
      return next;
    });
  }

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

  return (
    <section className="relative h-full min-h-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsQuestionBankOpen((current) => !current)}
        aria-label={isQuestionBankOpen ? "ซ่อนคลังคำถาม" : "แสดงคลังคำถาม"}
        aria-expanded={isQuestionBankOpen}
        aria-controls="question-bank"
        className="absolute right-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-2xl font-black text-white shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <span
          className={`block transition-transform duration-500 ${
            isQuestionBankOpen ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden="true"
        >
        +
        </span>
      </button>

      <button
        type="button"
        onClick={() => setIsScoreboardOpen((current) => !current)}
        aria-label={isScoreboardOpen ? "ซ่อนตารางคะแนน" : "แสดงตารางคะแนน"}
        aria-expanded={isScoreboardOpen}
        aria-controls="question-scoreboard"
        className="absolute left-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-2xl font-black text-slate-950 shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200"
      >
        <span aria-hidden="true">🏆</span>
      </button>

      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-3 rounded-[1.5rem] bg-slate-950 p-3 text-white shadow-sm ring-1 ring-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 pr-14 lg:pr-0">
            <span className="rounded-full bg-white/12 px-3 py-2 text-sm font-black text-sky-100">
              {currentModeLabel}
            </span>
            <button
              type="button"
              onClick={() => setRandomMode("question")}
              className={`min-h-10 rounded-xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300 ${
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
              className={`min-h-10 rounded-xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300 ${
                randomMode === "question-student"
                  ? "bg-sky-500 text-white"
                  : "bg-white/12 text-white hover:bg-white/20"
              }`}
            >
              คำถาม + ชื่อ
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <button
              type="button"
              onClick={() => randomize()}
              disabled={questions.length === 0}
              className="min-h-12 rounded-2xl bg-amber-400 px-4 text-lg font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              สุ่ม
            </button>
            <button
              type="button"
              onClick={() => setModeAndRandomize("question")}
              disabled={questions.length === 0}
              className="min-h-12 rounded-2xl bg-white px-4 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              สุ่มคำถาม
            </button>
            <button
              type="button"
              onClick={() => setModeAndRandomize("question-student")}
              disabled={questions.length === 0 || !canRandomStudent}
              className="min-h-12 rounded-2xl bg-sky-500 px-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              สุ่มชื่อด้วย
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit items-center rounded-2xl bg-sky-50 px-5 py-3 text-2xl font-black text-sky-800 sm:text-3xl">
                {selectedQuestion
                  ? `${selectedQuestion.points} คะแนน`
                  : "พร้อมเริ่ม"}
              </div>
              {selectedStudent ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 sm:flex-row sm:items-center">
                  <p className="break-words text-2xl font-black sm:text-3xl">
                    ผู้ตอบ: {selectedStudent.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => addPendingScore(selectedStudent.id)}
                    disabled={!selectedQuestion || selectedQuestion.points === 0}
                    className="min-h-11 rounded-xl bg-emerald-600 px-4 text-base font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    +{selectedQuestion?.points ?? 0} คะแนน
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex min-h-52 items-center justify-center text-center lg:min-h-72">
              <h2 className="break-words text-5xl font-black leading-tight text-slate-950 sm:text-7xl lg:text-8xl">
                {selectedQuestion?.prompt || "เพิ่มคำถาม แล้วกดสุ่มเพื่อเริ่ม"}
              </h2>
            </div>

            <div
              className={`mt-5 rounded-[1.5rem] border px-5 py-5 text-center transition ${
                showAnswer && selectedQuestion
                  ? "border-emerald-200 bg-emerald-50 opacity-100"
                  : "border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <p className="text-lg font-bold text-slate-500">เฉลย</p>
              <p className="mt-2 break-words text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
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
              className="min-h-14 rounded-2xl bg-emerald-600 px-6 text-xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {showAnswer ? "ซ่อนเฉลย" : "แสดงเฉลย"}
            </button>
            <button
              type="button"
              onClick={() => randomize()}
              disabled={questions.length === 0}
              className="min-h-14 rounded-2xl bg-slate-950 px-6 text-xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              สุ่มคำถามถัดไป
            </button>
          </div>
        </div>
      </div>

      <aside
        id="question-bank"
        className={`absolute bottom-0 right-0 top-0 z-20 flex min-h-0 w-full max-w-[430px] origin-right flex-col rounded-l-[1.5rem] bg-white p-4 shadow-2xl ring-1 ring-slate-200 transition-all duration-500 ease-out sm:p-5 ${
          isQuestionBankOpen
            ? "translate-x-0 rotate-0 opacity-100"
            : "pointer-events-none translate-x-[108%] rotate-3 opacity-0"
        }`}
      >
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

      <aside
        id="question-scoreboard"
        className={`absolute bottom-0 left-0 top-0 z-20 flex min-h-0 w-full max-w-[430px] origin-left flex-col rounded-r-[1.5rem] bg-white p-4 shadow-2xl ring-1 ring-slate-200 transition-all duration-500 ease-out sm:p-5 ${
          isScoreboardOpen
            ? "translate-x-0 rotate-0 opacity-100"
            : "pointer-events-none -translate-x-[108%] -rotate-3 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-yellow-700">คะแนนรอบนี้</p>
            <h2 className="mt-1 text-3xl font-black">เพิ่มคะแนน</h2>
            <p className="mt-1 text-lg font-bold text-slate-500">
              คะแนนที่จะบันทึก {totalPendingScore}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsScoreboardOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-2xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            aria-label="ปิดตารางคะแนน"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={savePendingScores}
          disabled={pendingScores.size === 0}
          className="mt-4 min-h-12 shrink-0 rounded-2xl bg-emerald-600 px-5 text-lg font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          บันทึกคะแนน
        </button>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {alphabeticalRows.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-2xl font-black text-slate-700">
                ยังไม่มีรายชื่อ
              </p>
              <Link
                href="/students"
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-lg font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
              >
                ไปเพิ่มรายชื่อ
              </Link>
            </div>
          ) : (
            alphabeticalRows.map((student) => {
              const pendingScore = pendingScores.get(student.id) ?? 0;

              return (
                <div
                  key={student.id}
                  className="grid grid-cols-[minmax(0,1fr)_72px_112px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <p className="truncate text-xl font-black text-slate-950">
                    {student.name}
                  </p>
                  <p className="text-right text-xl font-black text-emerald-700">
                    +{pendingScore}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => changePendingScore(student.id, -1)}
                      className="min-h-10 rounded-xl bg-slate-200 text-xl font-black text-slate-950 transition hover:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      aria-label={`ลดคะแนนที่จะเพิ่มให้ ${student.name}`}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => addPendingScore(student.id)}
                      disabled={!selectedQuestion || selectedQuestion.points === 0}
                      className="min-h-10 rounded-xl bg-emerald-600 text-base font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                      aria-label={`เพิ่มคะแนนที่จะเพิ่มให้ ${student.name}`}
                    >
                      +{selectedQuestion?.points ?? 0}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </section>
  );
}
