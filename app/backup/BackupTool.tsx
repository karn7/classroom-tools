"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { pushLocalClassroomDataToMongo } from "@/lib/classroom-data";

type BackupData = {
  exportedAt: string;
  origin: string;
  values: Record<string, string>;
};

const STORAGE_PREFIX = "classroom-tools:";

function collectBackupData(): BackupData {
  const values: Record<string, string> = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const value = window.localStorage.getItem(key);
      if (value !== null) {
        values[key] = value;
      }
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    values,
  };
}

function parseBackup(text: string): BackupData | null {
  try {
    const parsed = JSON.parse(text) as BackupData;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.values ||
      typeof parsed.values !== "object"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export default function BackupTool() {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBackupText(JSON.stringify(collectBackupData(), null, 2));
  }, []);

  const keyCount = useMemo(() => {
    const backup = parseBackup(backupText);
    return backup ? Object.keys(backup.values).length : 0;
  }, [backupText]);

  function refreshBackup() {
    setBackupText(JSON.stringify(collectBackupData(), null, 2));
    setMessage("อัปเดตข้อมูลล่าสุดแล้ว");
  }

  function downloadBackup() {
    const backup = collectBackupData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `classroom-tools-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupText(JSON.stringify(backup, null, 2));
    setMessage("ดาวน์โหลดไฟล์ backup แล้ว");
  }

  function importBackup() {
    const backup = parseBackup(backupText);
    if (!backup) {
      setMessage("ไฟล์หรือข้อมูล backup ไม่ถูกต้อง");
      return;
    }

    const confirmed = window.confirm(
      `นำเข้าข้อมูล ${Object.keys(backup.values).length} รายการหรือไม่`,
    );
    if (!confirmed) {
      return;
    }

    Object.entries(backup.values).forEach(([key, value]) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.setItem(key, value);
      }
    });
    setMessage("นำเข้าข้อมูลแล้ว กลับหน้าแรกและ refresh ได้เลย");
  }

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBackupText(String(reader.result));
      setMessage("โหลดไฟล์ backup แล้ว");
    };
    reader.onerror = () => setMessage("อ่านไฟล์ไม่สำเร็จ");
    reader.readAsText(file);
    event.target.value = "";
  }

  async function uploadLocalDataToMongo() {
    try {
      setMessage("กำลังส่งข้อมูลขึ้น MongoDB...");
      await pushLocalClassroomDataToMongo();
      setMessage("ส่งข้อมูล local ขึ้น MongoDB แล้ว");
    } catch {
      setMessage("ส่งข้อมูลขึ้น MongoDB ไม่สำเร็จ");
    }
  }

  return (
    <div className="stage-viewport bg-[#f6f7fb] text-slate-950">
      <main className="stage-16-9 grid gap-4 p-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-base font-black text-emerald-700">
            Classroom Tools
          </p>
          <h1 className="mt-2 text-4xl font-black leading-tight">
            สำรองข้อมูล
          </h1>
          <p className="mt-3 text-lg font-bold leading-relaxed text-slate-600">
            ใช้ย้ายข้อมูลระหว่าง localhost กับเว็บที่ deploy แล้ว
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={downloadBackup}
              className="min-h-14 rounded-2xl bg-emerald-600 px-5 text-xl font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              ส่งออกข้อมูล
            </button>
            <label className="grid min-h-14 cursor-pointer place-items-center rounded-2xl bg-slate-950 px-5 text-xl font-black text-white transition hover:bg-slate-800 focus-within:ring-4 focus-within:ring-slate-200">
              เลือกไฟล์ backup
              <input
                type="file"
                accept="application/json,.json"
                onChange={importFile}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={importBackup}
              className="min-h-14 rounded-2xl bg-amber-400 px-5 text-xl font-black text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200"
            >
              นำเข้าข้อมูล
            </button>
            <button
              type="button"
              onClick={refreshBackup}
              className="min-h-12 rounded-2xl bg-slate-100 px-4 text-base font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              อ่านข้อมูลล่าสุด
            </button>
            <button
              type="button"
              onClick={uploadLocalDataToMongo}
              className="min-h-12 rounded-2xl bg-sky-600 px-4 text-base font-black text-white transition hover:bg-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              ส่งข้อมูลขึ้น MongoDB
            </button>
            <Link
              href="/"
              className="grid min-h-12 place-items-center rounded-2xl bg-slate-100 px-4 text-base font-black text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              กลับหน้าแรก
            </Link>
          </div>

          <div className="mt-auto rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-500">จำนวนข้อมูล</p>
            <p className="mt-1 text-4xl font-black text-slate-950">
              {keyCount}
            </p>
            {message ? (
              <p className="mt-2 text-sm font-black text-emerald-700">
                {message}
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-sm ring-1 ring-slate-200">
          <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="text-2xl font-black">ข้อมูล backup</h2>
            <p className="rounded-full bg-white/10 px-3 py-1 text-sm font-black text-white/70">
              localStorage
            </p>
          </div>
          <textarea
            value={backupText}
            onChange={(event) => setBackupText(event.target.value)}
            spellCheck={false}
            className="mt-4 min-h-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none focus:ring-4 focus:ring-emerald-200"
          />
        </section>
      </main>
    </div>
  );
}
