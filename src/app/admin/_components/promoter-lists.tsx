"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { PromoterList } from "@/lib/rrpp";
import { formatTime } from "@/app/puerta/time";
import { fromLocalInput, toLocalInput } from "../_lib/dates";
import {
  createPromoterList,
  listPromoterLists,
  listPromoters,
  updatePromoterList,
  type ListResult,
  type Promoter,
} from "../_lib/lists";
import { buttonClass, Card } from "./ui";

const MESSAGES: Record<string, string> = {
  list_exists: "Ese RRPP ya tiene una lista en esta fecha. Editala en lugar de crear otra.",
  quota_below_issued: "El cupo no puede quedar por debajo de la gente ya anotada.",
  invalid_promoter: "Elegí un RRPP de la lista.",
  invalid_name: "Revisá el nombre de la lista.",
  invalid_quota: "El cupo tiene que ser un número entre 1 y 5000.",
  invalid_valid_until: "La hora límite tiene que ser a futuro.",
  forbidden: "Tu usuario no administra este boliche.",
  event_unavailable: "Esa fecha ya no existe. Recargá la página.",
  not_found: "Esa lista ya no existe. Recargá la página.",
  expired: "La sesión venció. Volvé a entrar.",
  network: "No pudimos conectar con el servidor. Probá de nuevo.",
};
const message = (code: string) => MESSAGES[code] ?? MESSAGES.network;

const input =
  "mt-1.5 block min-h-11 w-full rounded-xl border border-linea bg-noche px-3 text-base text-luz outline-none focus:border-accent/70";

function goToLogin() {
  // Navegación completa a propósito, igual que el resto del panel.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/ingresar?desde=${encodeURIComponent(window.location.pathname)}&vencida=1`;
}

/** Listas de RRPP de una fecha: tabla y alta / edición. Solo con API real. */
export function PromoterLists({ venue, event }: { venue: string; event: string }) {
  const [lists, setLists] = useState<PromoterList[] | null>(null);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoterList | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  /** Si la sesión venció manda al ingreso; devuelve true. */
  const handleExpired = <T,>(r: ListResult<T>) => {
    if (!r.ok && r.error === "expired") {
      goToLogin();
      return true;
    }
    return false;
  };

  const load = useCallback(async () => {
    const [l, p] = await Promise.all([
      listPromoterLists(venue, event).catch(() => ({ ok: false, error: "network" }) as const),
      listPromoters(venue).catch(() => ({ ok: false, error: "network" }) as const),
    ]);
    if ((!l.ok && l.error === "expired") || (!p.ok && p.error === "expired")) return goToLogin();
    if (!l.ok) {
      setLoadError(message(l.error));
      setLists((prev) => prev ?? []);
    } else {
      setLoadError(null);
      setLists(l.data);
    }
    if (p.ok) setPromoters(p.data);
  }, [venue, event]);

  useEffect(() => {
    // Carga inicial desde la API: el estado se completa cuando responde.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function toggle(list: PromoterList) {
    setError(null);
    setBusy(true);
    const r = await updatePromoterList(venue, event, list.id, { isActive: !list.isActive }).catch(
      () => ({ ok: false, error: "network" }) as const,
    );
    setBusy(false);
    if (handleExpired(r)) return;
    if (!r.ok) return setError(message(r.error));
    await load();
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linea px-4 py-4 sm:px-6">
        <h2 className="font-semibold">Listas de RRPP</h2>
        {editing === null && (
          <button type="button" className={buttonClass.primary} onClick={() => setEditing("new")}>
            Nueva lista
          </button>
        )}
      </div>

      {(loadError || error) && (
        <p role="alert" className="mx-4 mt-4 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error sm:mx-6">
          {error ?? loadError}
        </p>
      )}

      {editing !== null && (
        <ListForm
          // key: al cambiar de lista el formulario arranca de cero.
          key={editing === "new" ? "new" : String(editing.id)}
          venue={venue}
          event={event}
          list={editing === "new" ? null : editing}
          promoters={promoters}
          onDone={async () => {
            setEditing(null);
            await load();
          }}
          onCancel={() => setEditing(null)}
          onExpired={goToLogin}
        />
      )}

      {lists === null ? (
        <p className="px-4 py-6 text-sm text-tenue sm:px-6">Cargando…</p>
      ) : lists.length === 0 ? (
        <p className="px-4 py-6 text-sm text-tenue sm:px-6">Todavía no hay listas para esta fecha.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-tenue">
              <tr className="border-b border-linea">
                <th className="px-4 py-3 font-medium sm:px-6">RRPP</th>
                <th className="px-2 py-3 font-medium">Lista</th>
                <th className="px-2 py-3 text-right font-medium">Anotados</th>
                <th className="px-2 py-3 text-right font-medium">Ingresaron</th>
                <th className="px-2 py-3 font-medium">Cierra</th>
                <th className="px-2 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 sm:px-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lists.map((l) => (
                <tr key={l.id} className={`border-b border-linea last:border-0 ${l.isActive ? "" : "text-tenue"}`}>
                  <td className="px-4 py-3 sm:px-6">{l.promoter.name || l.promoter.username}</td>
                  <td className="px-2 py-3">{l.name}</td>
                  <td className="px-2 py-3 text-right tabular-nums">
                    {l.issued} / {l.quota}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{l.admitted}</td>
                  <td className="px-2 py-3 tabular-nums">{formatTime(l.validUntil)} h</td>
                  <td className="px-2 py-3">{l.isActive ? "Activa" : "Pausada"}</td>
                  <td className="px-4 py-2 sm:px-6">
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={busy} className={buttonClass.secondary} onClick={() => setEditing(l)}>
                        Editar
                      </button>
                      <button type="button" disabled={busy} className={buttonClass.secondary} onClick={() => toggle(l)}>
                        {l.isActive ? "Pausar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ListForm({
  venue,
  event,
  list,
  promoters,
  onDone,
  onCancel,
  onExpired,
}: {
  venue: string;
  event: string;
  list: PromoterList | null;
  promoters: Promoter[];
  onDone: () => Promise<void>;
  onCancel: () => void;
  onExpired: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const noPromoters = !list && promoters.length === 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("nombre") ?? "").trim();
    const quota = Number(data.get("cupo"));
    const until = String(data.get("hasta") ?? "");
    const promoter = String(data.get("rrpp") ?? "");
    if (!name) return setError(MESSAGES.invalid_name);
    if (!Number.isInteger(quota) || quota < 1 || quota > 5000) return setError(MESSAGES.invalid_quota);
    if (!until) return setError(MESSAGES.invalid_valid_until);
    if (!list && !promoter) return setError(MESSAGES.invalid_promoter);
    const validUntil = fromLocalInput(until);
    setError(null);
    setSaving(true);
    const r: ListResult<PromoterList> = await (list
      ? updatePromoterList(venue, event, list.id, { name, quota, validUntil })
      : createPromoterList(venue, event, { name, promoterUsername: promoter, quota, validUntil })
    ).catch(() => ({ ok: false, error: "network" }) as const);
    setSaving(false);
    if (!r.ok) {
      if (r.error === "expired") return onExpired();
      return setError(message(r.error));
    }
    await onDone();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border-b border-linea px-4 py-5 sm:px-6">
      <h3 className="font-semibold">{list ? `Editar ${list.name}` : "Nueva lista"}</h3>
      {noPromoters ? (
        <p className="text-sm text-tenue">
          Todavía no hay RRPP en este boliche. Se cargan desde el equipo del boliche con el rol RRPP; después vas a poder armarles una lista acá.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            RRPP
            {list ? (
              <input value={list.promoter.name || list.promoter.username} disabled className={`${input} opacity-60`} readOnly />
            ) : (
              <select name="rrpp" defaultValue="" className={input}>
                <option value="" disabled>
                  Elegí un RRPP
                </option>
                {promoters.map((p) => (
                  <option key={p.username} value={p.username}>
                    {p.name || p.username}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="block text-sm font-medium">
            Nombre de la lista
            <input name="nombre" defaultValue={list?.name ?? ""} maxLength={80} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Cupo
            <input name="cupo" type="number" inputMode="numeric" min={1} max={5000} defaultValue={list?.quota ?? ""} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Cierra (hora de Argentina)
            <input name="hasta" type="datetime-local" defaultValue={list ? toLocalInput(list.validUntil) : ""} className={input} />
          </label>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!noPromoters && (
          <button type="submit" disabled={saving} className={buttonClass.primary}>
            {saving ? "Guardando…" : list ? "Guardar cambios" : "Crear lista"}
          </button>
        )}
        <button type="button" disabled={saving} className={buttonClass.secondary} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
