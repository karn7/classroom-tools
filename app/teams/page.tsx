import Link from "next/link";
import TeamBuilder from "./TeamBuilder";

export default function TeamsPage() {
  return (
    <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
      <main className="stage-16-9 flex flex-col gap-3 p-3 sm:p-4">
        <header className="flex shrink-0 flex-col gap-2 rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">กิจกรรม</p>
            <h1 className="mt-0.5 text-3xl font-black leading-tight sm:text-4xl">
              👥 แบ่งทีม
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-base font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            กลับหน้าหลัก
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <TeamBuilder />
        </div>
      </main>
    </div>
  );
}
