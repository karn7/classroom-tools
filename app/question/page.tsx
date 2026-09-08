import Link from "next/link";
import QuestionTool from "./QuestionTool";

export default function QuestionPage() {
  return (
    <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
      <main className="stage-16-9 flex flex-col gap-4 p-4 sm:p-5">
        <header className="flex shrink-0 flex-col gap-3 rounded-[1.5rem] bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-semibold text-sky-700">กิจกรรม</p>
            <h1 className="mt-1 text-3xl font-black leading-tight sm:text-5xl">
              ❓ คำถาม
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-950 px-6 text-xl font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            กลับหน้าหลัก
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <QuestionTool />
        </div>
      </main>
    </div>
  );
}
