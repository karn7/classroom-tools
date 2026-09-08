"use client";

import Link from "next/link";
import { useState } from "react";

const activities = [
  {
    href: "/students",
    emoji: "👩‍🎓",
    title: "รายชื่อ",
    desc: "จัดการรายชื่อนักศึกษากลาง",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    href: "/name-wheel",
    emoji: "🎡",
    title: "วงล้อสุ่มชื่อ",
    desc: "สุ่มชื่อนักศึกษาและตัดชื่อที่ถูกสุ่มแล้วออกได้",
    accent: "from-rose-500 to-pink-500",
  },
  {
    href: "/question",
    emoji: "❓",
    title: "คำถาม",
    desc: "เตรียมคำถามและเลือกใช้ในชั้นเรียน",
    accent: "from-sky-500 to-cyan-500",
  },
  {
    href: "/guessing-game",
    emoji: "🎮",
    title: "เกมทายคำ",
    desc: "กิจกรรมทายคำเพื่อเรียกความสนใจ",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    href: "/board-game",
    emoji: "🎲",
    title: "บอร์ดเกม",
    desc: "กระดานกิจกรรมสำหรับเล่นเป็นกลุ่ม",
    accent: "from-amber-500 to-orange-500",
  },
  {
    href: "/teams",
    emoji: "👥",
    title: "แบ่งทีม",
    desc: "สุ่มแบ่งกลุ่มหรือจัดทีมอย่างรวดเร็ว",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    href: "/timer",
    emoji: "⏱️",
    title: "จับเวลา",
    desc: "จับเวลาและนับถอยหลังสำหรับกิจกรรม",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    href: "/scoreboard",
    emoji: "🏆",
    title: "คะแนนสะสม",
    desc: "แสดงและบันทึกคะแนนของแต่ละทีม",
    accent: "from-yellow-500 to-lime-500",
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="stage-viewport bg-slate-950 text-white">
      <main className="stage-16-9 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bs101.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/18 to-slate-950/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,transparent_40%,rgba(2,6,23,0.42)_100%)]" />

        <header className="relative z-20 flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <Link
            href="/"
            className="w-fit rounded-2xl bg-white/12 px-4 py-2 text-lg font-black text-white shadow-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 sm:text-xl"
          >
            Classroom Tools
          </Link>
          <div className="flex w-full flex-col items-end gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label={isMenuOpen ? "ซ่อนเมนู" : "ขยายเมนู"}
              aria-expanded={isMenuOpen}
              aria-controls="main-activity-menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-2xl font-black leading-none text-slate-950 shadow-lg ring-1 ring-white/40 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-200"
            >
              <span
                className={`block transition-transform duration-500 ${
                  isMenuOpen ? "rotate-45" : "rotate-0"
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <nav
              id="main-activity-menu"
              className={`flex w-full origin-top-right gap-2 overflow-x-auto rounded-2xl bg-white/12 p-2 shadow-sm ring-1 ring-white/20 backdrop-blur transition-all duration-500 ease-out sm:flex-wrap sm:overflow-visible lg:w-auto lg:justify-end ${
                isMenuOpen
                  ? "max-h-56 scale-100 rotate-0 opacity-100"
                  : "pointer-events-none max-h-0 scale-95 -rotate-3 opacity-0"
              }`}
              aria-label="เมนูกิจกรรม"
            >
              {activities.map((activity, index) => (
                <Link
                  key={activity.href}
                  href={activity.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/88 px-3 py-2 text-sm font-black text-slate-950 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-200 sm:px-3 sm:text-sm xl:px-4 xl:text-base ${
                    isMenuOpen
                      ? "translate-y-0 rotate-0 opacity-100"
                      : "-translate-y-2 rotate-2 opacity-0"
                  }`}
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 35}ms` : "0ms",
                  }}
                >
                  <span className="text-xl" aria-hidden="true">
                    {activity.emoji}
                  </span>
                  {activity.title}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="absolute inset-x-0 bottom-0 z-10 flex items-end px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="max-w-2xl">
            <p className="text-base font-black text-amber-200 drop-shadow sm:text-lg">
              BS101
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight drop-shadow-2xl sm:text-3xl lg:text-4xl">
              Old & New Testament Survey
            </h1>
            <p className="mt-2 text-base font-bold leading-relaxed text-white/85 drop-shadow sm:text-lg">
              เครื่องมือสำหรับกิจกรรมการเรียนการสอน
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
