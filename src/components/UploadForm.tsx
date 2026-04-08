"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EQ_CLASSES, EQ_RACES, EQ_SERVERS } from "@/lib/types";
import { getBonusPointsForClass } from "@/lib/baseStats";

const STAT_KEYS = ["str", "sta", "agi", "dex", "wis", "int", "cha"] as const;
const STAT_LABELS: Record<string, string> = {
  str: "STR", sta: "STA", agi: "AGI", dex: "DEX",
  wis: "WIS", int: "INT", cha: "CHA",
};

function extractNameFromFilename(filename: string): string {
  const match = filename.match(/^(.+?)[-_]Inventory\.txt$/i);
  return match ? match[1] : "";
}

export default function UploadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [level, setLevel] = useState("");
  const [race, setRace] = useState("");
  const [server, setServer] = useState("P1999 Green");
  const [inventoryText, setInventoryText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showBonusPoints, setShowBonusPoints] = useState(false);
  const [bonusPoints, setBonusPoints] = useState<Record<string, number>>({
    str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0,
  });
  const [editRaw, setEditRaw] = useState<Record<string, string>>({});
  const [nameFromFile, setNameFromFile] = useState(false);

  const fileUploaded = !!inventoryText;
  const maxBonus = className ? getBonusPointsForClass(className) : 30;
  const usedBonus = Object.values(bonusPoints).reduce((a, b) => a + b, 0);
  const remainingBonus = maxBonus - usedBonus;
  const nameValid = /^[A-Za-z]{4,15}$/.test(name.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        name, className, level, race, server, inventoryText,
      };
      if (showBonusPoints) {
        payload.bonusPoints = bonusPoints;
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function processFile(file: File) {
    const detected = extractNameFromFilename(file.name);
    if (detected) {
      setName(detected);
      setNameFromFile(true);
    } else {
      setNameFromFile(false);
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInventoryText(ev.target?.result as string);
    };
    reader.readAsText(file);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function clearFile() {
    setInventoryText("");
    setFileName("");
    setName("");
    setNameFromFile(false);
  }

  function updateBonusPoint(stat: string, value: number): number {
    const clamped = Math.max(0, value);
    const otherUsed = usedBonus - bonusPoints[stat];
    const maxForStat = maxBonus - otherUsed;
    const final = Math.min(clamped, maxForStat);
    setBonusPoints((prev) => ({
      ...prev,
      [stat]: final,
    }));
    return final;
  }

  const inputClasses =
    "w-full bg-zinc-900/80 border border-amber-900/40 rounded-lg px-4 py-3 text-amber-100 " +
    "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 " +
    "placeholder:text-zinc-500 transition-all";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">

      {/* Step 1: Inventory File Upload */}
      {!fileUploaded ? (
        <div>
          <p className="text-zinc-400 text-sm mb-4 text-center leading-relaxed">
            Run{" "}
            <code className="text-amber-400/80 bg-zinc-800 px-1.5 py-0.5 rounded">/outputfile inventory</code>{" "}
            in EverQuest, then upload the resulting file.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-amber-500 bg-amber-500/10"
                : "border-amber-900/40 hover:border-amber-700/60"
            }`}
          >
            <input
              type="file"
              accept=".txt,.tab"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-zinc-400">
              <svg
                className="mx-auto h-12 w-12 text-amber-700/60 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm">
                Drop your inventory file here, or click to browse
              </span>
              <p className="text-zinc-600 text-xs mt-1">
                Look for <span className="text-zinc-500">Character-Inventory.txt</span> in your EverQuest install folder
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed file summary */
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-amber-900/20 rounded-lg px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-amber-600/10 border border-amber-600/20 flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-amber-300/80 text-sm font-medium truncate block">{fileName}</span>
            <span className="text-zinc-600 text-[10px]">Inventory loaded</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="text-zinc-600 hover:text-amber-400 transition-colors text-xs"
          >
            Change
          </button>
        </div>
      )}

      {/* Step 2: Character Details (shown after file upload) */}
      {fileUploaded && (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-200/80 text-sm font-medium mb-1.5">
                Character Name
              </label>
              {nameFromFile ? (
                <div className="flex items-center gap-2 bg-zinc-900/80 border border-amber-900/40 rounded-lg px-4 py-3">
                  <span className="text-amber-100 flex-1">{name}</span>
                  <span className="text-zinc-500 text-[10px]">from file</span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={4}
                    maxLength={15}
                    pattern="[A-Za-z]+"
                    placeholder="e.g. Naberial"
                    className={inputClasses}
                  />
                  {name && !nameValid && (
                    <p className="text-red-400/80 text-[10px] mt-1">4-15 letters, no numbers or spaces</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-amber-200/80 text-sm font-medium mb-1.5">
                Level
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                placeholder="1-60"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-amber-200/80 text-sm font-medium mb-1.5">
                Class
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className={inputClasses}
              >
                <option value="">Select Class</option>
                {EQ_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-amber-200/80 text-sm font-medium mb-1.5">
                Race
              </label>
              <select
                value={race}
                onChange={(e) => setRace(e.target.value)}
                required
                className={inputClasses}
              >
                <option value="">Select Race</option>
                {EQ_RACES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-amber-200/80 text-sm font-medium mb-1.5">
                Server
              </label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className={inputClasses}
              >
                {EQ_SERVERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bonus Points (optional) */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowBonusPoints(!showBonusPoints)}
              className="text-amber-500/70 hover:text-amber-400 text-xs transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showBonusPoints ? "rotate-90" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
              Creation Bonus Points (optional, for exact stat totals)
            </button>

            {showBonusPoints && (
              <div className="mt-3 bg-zinc-900/40 border border-amber-900/20 rounded-lg p-4">
                <p className="text-zinc-500 text-[10px] mb-3">
                  Enter how you allocated your {maxBonus} bonus points at character creation.
                  <span className={`ml-2 font-bold ${remainingBonus < 0 ? "text-red-400" : remainingBonus === 0 ? "text-green-400" : "text-amber-400"}`}>
                    {remainingBonus} remaining
                  </span>
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {STAT_KEYS.map((stat) => (
                    <div key={stat} className="text-center">
                      <label className="block text-zinc-400 text-[10px] uppercase mb-1">
                        {STAT_LABELS[stat]}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editRaw[stat] ?? String(bonusPoints[stat])}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          if (raw === "") {
                            setEditRaw((prev) => ({ ...prev, [stat]: raw }));
                          } else {
                            const actual = updateBonusPoint(stat, parseInt(raw, 10));
                            setEditRaw((prev) => ({ ...prev, [stat]: String(actual) }));
                          }
                        }}
                        onBlur={() => {
                          if (editRaw[stat] === "") {
                            updateBonusPoint(stat, 0);
                          }
                          setEditRaw((prev) => {
                            const next = { ...prev };
                            delete next[stat];
                            return next;
                          });
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-2 py-1.5 text-amber-200 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 [appearance:textfield]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !nameValid || !className || !level || !race}
            className={
              "w-full mt-6 py-3.5 px-6 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all " +
              "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 " +
              "hover:from-amber-600 hover:to-amber-500 " +
              "disabled:opacity-40 disabled:cursor-not-allowed " +
              "shadow-lg shadow-amber-900/30"
            }
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scrying...
              </span>
            ) : (
              "Gaze into the Pool"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
