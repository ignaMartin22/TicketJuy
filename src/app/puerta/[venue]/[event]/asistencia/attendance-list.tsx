"use client";

import { useState } from "react";
import { formatTime } from "../../../time";

type Row = { id: string; holderName: string; ticketType: string; usedAt: string | null; usedBy: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function AttendanceList({ tickets }: { tickets: Row[] }) {
  const [query, setQuery] = useState("");
  const q = norm(query.trim());
  const rows = q ? tickets.filter((t) => norm(t.holderName).includes(q)) : tickets;
  return (
    <section className="mt-6">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Buscar por nombre
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-linea bg-noche-2 px-4 text-base text-luz focus:border-accent focus:outline-none"
        />
      </label>
      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((t) => (
          <li key={t.id} className="panel flex items-start justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <p className="break-words font-semibold">{t.holderName}</p>
              <p className="text-sm text-tenue">{t.ticketType}</p>
            </div>
            <p className={`shrink-0 text-right text-sm ${t.usedAt ? "" : "text-tenue"}`}>
              {t.usedAt ? (
                <>
                  <span className="block tabular-nums">{formatTime(t.usedAt)}</span>
                  {t.usedBy && <span className="block text-tenue">{t.usedBy}</span>}
                </>
              ) : (
                "No ingresó"
              )}
            </p>
          </li>
        ))}
        {rows.length === 0 && <li className="text-tenue">{q ? "Nadie con ese nombre." : "Todavía no hay entradas."}</li>}
      </ul>
    </section>
  );
}
