"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Student,
  loadScoreMap,
  loadStudents,
  saveScoreMap,
} from "@/lib/classroom-data";

type Team = {
  id: string;
  name: string;
  members: Student[];
  pendingScore: number;
};

const TEAM_COUNTS = [2, 3, 4, 5];
const TEAM_COLORS = [
  "bg-emerald-50 text-emerald-900 ring-emerald-200",
  "bg-sky-50 text-sky-900 ring-sky-200",
  "bg-amber-50 text-amber-900 ring-amber-200",
  "bg-rose-50 text-rose-900 ring-rose-200",
  "bg-violet-50 text-violet-900 ring-violet-200",
];

function shuffleStudents(students: Student[]) {
  const shuffled = [...students];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function buildTeams(students: Student[], teamCount: number) {
  const shuffled = shuffleStudents(students);
  const teams = Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `ทีม ${index + 1}`,
    members: [] as Student[],
    pendingScore: 0,
  }));

  shuffled.forEach((student, index) => {
    teams[index % teamCount].members.push(student);
  });

  return teams;
}

function buildEmptyTeams(teamCount: number, previousTeams: Team[] = []) {
  return Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    name: previousTeams[index]?.name || `ทีม ${index + 1}`,
    members: [] as Student[],
    pendingScore: previousTeams[index]?.pendingScore ?? 0,
  }));
}

type TeamBuilderProps = {
  courseId?: string;
};

export default function TeamBuilder({ courseId }: TeamBuilderProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [savedTeamId, setSavedTeamId] = useState<string | null>(null);
  const [isManualPanelOpen, setIsManualPanelOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const loadedStudents = loadStudents(courseId);
      setStudents(loadedStudents);
      setScores(loadScoreMap(courseId));
      setTeams(buildTeams(loadedStudents, teamCount));
      setUnassignedStudents([]);
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, teamCount]);

  useEffect(() => {
    if (hasLoaded) {
      saveScoreMap(scores, courseId);
    }
  }, [hasLoaded, scores]);

  const totalPendingScore = useMemo(
    () => teams.reduce((total, team) => total + team.pendingScore, 0),
    [teams],
  );
  const teamGridColumns = `repeat(${Math.max(teamCount, 1)}, minmax(0, 1fr))`;

  function randomizeTeams() {
    setTeams((current) => {
      const nextTeams = buildTeams(students, teamCount);
      return nextTeams.map((team, index) => ({
        ...team,
        name: current[index]?.name || team.name,
        pendingScore: current[index]?.pendingScore ?? 0,
      }));
    });
    setUnassignedStudents([]);
    setIsManualPanelOpen(false);
    setSavedTeamId(null);
  }

  function startManualGrouping() {
    setTeams((current) => buildEmptyTeams(teamCount, current));
    setUnassignedStudents(students);
    setIsManualPanelOpen(true);
    setSavedTeamId(null);
  }

  function moveStudent(studentId: string, targetTeamId: string) {
    const student = students.find((item) => item.id === studentId);
    if (!student) {
      return;
    }

    setTeams((current) =>
      current.map((team) => ({
        ...team,
        members:
          team.id === targetTeamId
            ? [
                ...team.members.filter((member) => member.id !== studentId),
                student,
              ]
            : team.members.filter((member) => member.id !== studentId),
      })),
    );

    setUnassignedStudents((current) => {
      const withoutStudent = current.filter((member) => member.id !== studentId);
      return targetTeamId === "unassigned"
        ? [...withoutStudent, student]
        : withoutStudent;
    });
  }

  function updateTeamName(teamId: string, name: string) {
    setTeams((current) =>
      current.map((team) => (team.id === teamId ? { ...team, name } : team)),
    );
  }

  function updateTeamScore(teamId: string, score: number) {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? { ...team, pendingScore: Math.max(0, Math.round(score || 0)) }
          : team,
      ),
    );
  }

  function addTeamScore(teamId: string, amount: number) {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? { ...team, pendingScore: Math.max(0, team.pendingScore + amount) }
          : team,
      ),
    );
  }

  function saveTeamScore(team: Team) {
    if (team.pendingScore === 0 || team.members.length === 0) {
      return;
    }

    setScores((current) => {
      const next = new Map(current);
      team.members.forEach((member) => {
        next.set(member.id, (next.get(member.id) ?? 0) + team.pendingScore);
      });
      return next;
    });
    setSavedTeamId(team.id);
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsManualPanelOpen((current) => !current)}
        aria-label={isManualPanelOpen ? "ซ่อนรายชื่อรอจัด" : "แสดงรายชื่อรอจัด"}
        aria-expanded={isManualPanelOpen}
        aria-controls="manual-team-pool"
        className="absolute left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-slate-950 shadow-xl ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        👥
      </button>

      <div className="grid shrink-0 gap-2 rounded-[1.25rem] bg-slate-950 p-2.5 pl-14 text-white shadow-sm ring-1 ring-slate-800 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-black text-emerald-100 sm:text-sm">
            นักศึกษา {students.length} คน
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-black text-sky-100 sm:text-sm">
            รอจัด {unassignedStudents.length} คน
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-black text-yellow-100 sm:text-sm">
            คะแนนรอบนี้ {totalPendingScore}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TEAM_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => {
                setTeamCount(count);
                setSavedTeamId(null);
              }}
              className={`min-h-9 rounded-xl px-3 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-emerald-300 sm:text-sm ${
                teamCount === count
                  ? "bg-emerald-500 text-white"
                  : "bg-white/12 text-white hover:bg-white/20"
              }`}
            >
              {count} ทีม
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={randomizeTeams}
          disabled={students.length === 0}
          className="min-h-10 rounded-2xl bg-amber-400 px-4 text-base font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          สุ่มแบ่งทีมใหม่
        </button>

        <button
          type="button"
          onClick={startManualGrouping}
          disabled={students.length === 0}
          className="min-h-10 rounded-2xl bg-white px-4 text-base font-black text-slate-950 transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          จัดเอง
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {students.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <div>
              <p className="text-3xl font-black text-slate-800">
                ยังไม่มีรายชื่อนักศึกษา
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
          <div
            className="grid h-full min-h-0 gap-3"
            style={{ gridTemplateColumns: teamGridColumns }}
          >
            {teams.map((team, index) => (
              <article
                key={team.id}
                className={`flex min-h-0 flex-col rounded-[1.25rem] p-3 shadow-sm ring-1 ${
                  TEAM_COLORS[index % TEAM_COLORS.length]
                }`}
              >
                <div className="flex shrink-0 items-start justify-between gap-2">
                  <input
                    value={team.name}
                    onChange={(event) =>
                      updateTeamName(team.id, event.target.value)
                    }
                    className="min-h-10 min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/70 px-3 text-xl font-black outline-none focus:ring-4 focus:ring-white/80"
                    aria-label={`ตั้งชื่อทีม ${index + 1}`}
                  />
                  <span className="rounded-2xl bg-white/70 px-3 py-2 text-base font-black">
                    {team.members.length} คน
                  </span>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-2 rounded-2xl bg-white/74 px-3 py-2 shadow-sm"
                    >
                      <span className="truncate text-lg font-black leading-tight">
                        {member.name}
                      </span>
                      <select
                        value={team.id}
                        onChange={(event) =>
                          moveStudent(member.id, event.target.value)
                        }
                        className="min-h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-950 outline-none focus:ring-4 focus:ring-emerald-200"
                        aria-label={`ย้าย ${member.name}`}
                      >
                        {teams.map((optionTeam) => (
                          <option key={optionTeam.id} value={optionTeam.id}>
                            {optionTeam.name}
                          </option>
                        ))}
                        <option value="unassigned">รอจัด</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-3 shrink-0 rounded-2xl bg-white/74 p-2.5">
                  <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] gap-2">
                    <button
                      type="button"
                      onClick={() => addTeamScore(team.id, -1)}
                      className="min-h-10 rounded-xl bg-slate-200 text-xl font-black text-slate-950 transition hover:bg-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200"
                      aria-label={`ลดคะแนน ${team.name}`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={team.pendingScore}
                      onChange={(event) =>
                        updateTeamScore(team.id, Number(event.target.value))
                      }
                      className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-center text-xl font-black text-slate-950 outline-none focus:ring-4 focus:ring-emerald-200"
                      aria-label={`คะแนนกลุ่ม ${team.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => addTeamScore(team.id, 1)}
                      className="min-h-10 rounded-xl bg-emerald-600 text-xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                      aria-label={`เพิ่มคะแนน ${team.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveTeamScore(team)}
                    disabled={team.pendingScore === 0 || team.members.length === 0}
                    className="mt-2 min-h-10 w-full rounded-xl bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {savedTeamId === team.id
                      ? "บันทึกคะแนนแล้ว"
                      : "บันทึกคะแนน"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside
        id="manual-team-pool"
        className={`absolute bottom-0 left-0 top-0 z-20 flex min-h-0 w-full max-w-[360px] origin-left flex-col rounded-r-[1.5rem] bg-white p-4 shadow-2xl ring-1 ring-slate-200 transition-all duration-500 ease-out ${
          isManualPanelOpen
            ? "translate-x-0 rotate-0 opacity-100"
            : "pointer-events-none -translate-x-[108%] -rotate-3 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-700">จัดกลุ่มเอง</p>
            <h2 className="mt-1 text-3xl font-black">รายชื่อรอจัด</h2>
            <p className="mt-1 text-lg font-bold text-slate-500">
              {unassignedStudents.length} คน
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManualPanelOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            aria-label="ปิดรายชื่อรอจัด"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {unassignedStudents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="text-2xl font-black text-slate-700">
                ไม่มีรายชื่อรอจัด
              </p>
            </div>
          ) : (
            unassignedStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"
              >
                <span className="truncate text-lg font-black text-slate-950">
                  {student.name}
                </span>
                <select
                  value="unassigned"
                  onChange={(event) => moveStudent(student.id, event.target.value)}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-slate-950 outline-none focus:ring-4 focus:ring-emerald-200"
                  aria-label={`เลือกทีมให้ ${student.name}`}
                >
                  <option value="unassigned">เลือกทีม</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
