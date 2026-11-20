"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { formatNight } from "@/lib/format";
import { counts, scan, type ScanOutcome } from "../../actions";
import { formatTime } from "../../time";

type Outcome = Exclude<ScanOutcome, { kind: "expired" }>;
type CameraState = "starting" | "on" | "denied" | "missing" | "failed";
type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

const READ_INTERVAL_MS = 125; // unas 8 lecturas por segundo
const RESULT_MS = 2500;
const SAME_CODE_MS = 3000;
const COUNTS_MS = 30_000;

const CAMERA_MESSAGES: Record<Exclude<CameraState, "starting" | "on">, string> = {
  denied:
    "No tenemos permiso para usar la cámara. Tocá el candado de la barra del navegador, habilitá la cámara para este sitio y probá de nuevo.",
  missing: "Este dispositivo no tiene cámara disponible. Usá el ingreso a mano.",
  failed: "No pudimos abrir la cámara. Cerrá otras apps que la usen y probá de nuevo.",
};

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export function Scanner({
  venue,
  event,
  title,
  initial,
}: {
  venue: string;
  event: string;
  title: string;
  initial: { admitted: number; issued: number };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false); // hay un resultado en pantalla o una llamada en curso
  const ignored = useRef(new Map<string, number>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, setPending] = useState(false);
  const [total, setTotal] = useState(initial);
  const [manual, setManual] = useState("");

  const expire = useCallback(() => {
    // Es un route handler (borra la cookie): necesita una navegación completa.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/puerta/sesion-vencida";
  }, []);

  const close = useCallback((code?: string) => {
    clearTimeout(closeTimer.current);
    if (code) ignored.current.set(code, Date.now() + SAME_CODE_MS);
    setOutcome(null);
    busy.current = false;
  }, []);

  const submit = useCallback(
    async (code: string) => {
      if (busy.current) return;
      const text = code.trim();
      if (!text) return;
      const until = ignored.current.get(text);
      if (until && until > Date.now()) return;
      busy.current = true;
      setPending(true);
      let r: ScanOutcome;
      try {
        r = await scan(venue, event, text);
      } catch {
        r = { kind: "error" };
      }
      setPending(false);
      if (r.kind === "expired") return expire();
      if (r.kind === "admitted") {
        vibrate(80);
        setTotal((t) => ({ ...t, admitted: t.admitted + 1 }));
      } else {
        vibrate([200, 100, 400]);
      }
      setOutcome(r);
      closeTimer.current = setTimeout(() => close(r.kind === "error" ? undefined : text), RESULT_MS);
    },
    [venue, event, expire, close],
  );
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Contador: se pide al servidor cada 30 segundos.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      const r = await counts(venue, event).catch(() => null);
      if (!r) return;
      if (r.ok) setTotal({ admitted: r.admitted, issued: r.issued });
      else if (r.expired) expire();
    }, COUNTS_MS);
    return () => clearInterval(id);
  }, [venue, event, expire]);

  // Cámara: se prende al entrar y al volver a la pestaña, se apaga al salir o al ocultarse.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let wake: WakeLockSentinel | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    let detector: Detector | null = null;
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (BD) {
      try {
        detector = new BD({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const stop = () => {
      generation++;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      wake?.release().catch(() => {});
      wake = null;
    };

    const read = async (gen: number) => {
      if (gen !== generation) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && !busy.current && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          let value: string | undefined;
          if (detector) {
            value = (await detector.detect(video))[0]?.rawValue;
          } else {
            const scale = Math.min(1, 640 / video.videoWidth);
            const w = Math.round(video.videoWidth * scale);
            const h = Math.round(video.videoHeight * scale);
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx?.drawImage(video, 0, 0, w, h);
            const img = ctx?.getImageData(0, 0, w, h);
            value = img ? jsQR(img.data, w, h, { inversionAttempts: "dontInvert" })?.data : undefined;
          }
          if (gen === generation && value) void submitRef.current(value);
        } catch {}
      }
      if (gen === generation) timer = setTimeout(() => read(gen), READ_INTERVAL_MS);
    };

    const start = async () => {
      stop();
      const gen = generation;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("missing");
        return;
      }
      setCamera("starting");
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (gen !== generation) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          await video.play().catch(() => {});
        }
        setCamera("on");
        try {
          wake = (await navigator.wakeLock?.request("screen")) ?? null;
        } catch {}
        void read(gen);
      } catch (e) {
        if (gen !== generation) return;
        const name = (e as DOMException)?.name;
        setCamera(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" ? "missing" : "failed");
      }
    };

    const onVisibility = () => (document.hidden ? stop() : void start());
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) void start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [attempt]);

  const [sheet, setSheet] = useState(false);
  const pct = total.issued ? Math.min(100, Math.round((total.admitted / total.issued) * 100)) : 0;

  return (
    <div className="puerta-escaner relative h-dvh overflow-hidden bg-black text-white">
      {/* La cámara ocupa toda la pantalla; la ventana del QR la recorta. */}
      <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" aria-label="Cámara para leer el QR" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="puerta-ventana" data-leyendo={pending || undefined} aria-hidden={camera === "on"}>
        {camera === "on" ? (
          <>
            <span className="puerta-esquina puerta-esquina-ai" />
            <span className="puerta-esquina puerta-esquina-ad" />
            <span className="puerta-esquina puerta-esquina-bi" />
            <span className="puerta-esquina puerta-esquina-bd" />
            <span className="puerta-laser" />
          </>
        ) : camera === "starting" ? (
          <p className="grid h-full place-items-center text-sm text-white/70">Abriendo la cámara…</p>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-5 text-center">
            <p className="text-sm text-white/85">{CAMERA_MESSAGES[camera]}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="min-h-12 rounded-full bg-white px-6 text-base font-semibold text-black"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      {/* Arriba: volver, la fecha y la asistencia. */}
      <header className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href="/puerta" aria-label="Cambiar de fecha" className="puerta-boton-redondo">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/60 uppercase">Portería</p>
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        </div>
        <Link href={`/puerta/${venue}/${event}/asistencia`} className="puerta-boton-redondo" aria-label="Ver asistencia">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
          </svg>
        </Link>
      </header>

      {/* Abajo: el contador grande, qué hacer y el ingreso a mano. */}
      <footer className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16">
        <p className="text-center text-sm text-white/75" aria-live="polite">
          {pending ? "Revisando…" : camera === "on" ? "Apuntá al QR de la entrada" : " "}
        </p>
        <div className="mx-auto mt-4 max-w-md">
          <div className="flex items-end justify-between gap-4">
            <p className="leading-none" aria-live="polite">
              <span className="display text-5xl tabular-nums">{total.admitted}</span>
              <span className="ml-2 text-lg text-white/60 tabular-nums">/ {total.issued}</span>
              <span className="mt-1.5 block text-sm text-white/60">adentro</span>
            </p>
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="min-h-12 rounded-full border border-white/25 bg-white/10 px-5 text-base font-semibold backdrop-blur-md"
            >
              Escribir código
            </button>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <div className="puerta-progreso h-full rounded-full" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
        </div>
      </footer>

      {sheet && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60" onClick={() => setSheet(false)}>
          <form
            className="puerta-hoja w-full rounded-t-[1.75rem] border-t border-white/10 bg-noche-2 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const code = manual;
              setManual("");
              setSheet(false);
              void submit(code);
            }}
          >
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/20" aria-hidden />
            <h2 className="text-lg font-semibold">Escribir el código</h2>
            <p className="mt-1 text-sm text-tenue">Para cuando el QR no se lee: pantalla rota, poca luz.</p>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
              Texto del QR
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                autoFocus
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="min-h-12 w-full rounded-xl border border-linea bg-noche px-4 text-base text-luz focus:border-accent focus:outline-none"
              />
            </label>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setSheet(false)} className="min-h-12 flex-1 rounded-full border border-linea font-semibold">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending || !manual.trim()}
                className="min-h-12 flex-1 rounded-full bg-luz font-semibold text-noche disabled:opacity-60"
              >
                Revisar
              </button>
            </div>
          </form>
        </div>
      )}

      {outcome && <ResultScreen outcome={outcome} onClose={() => close()} />}
    </div>
  );
}

const icons = {
  ok: <path d="M20 6 9 17l-5-5" />,
  no: <path d="M18 6 6 18M6 6l12 12" />,
  used: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  date: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  offline: (
    <>
      <path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5-2.7M19 12.9a10 10 0 0 0-2.4-1.8M2 9a15 15 0 0 1 4.5-2.6M22 9a15 15 0 0 0-8-3.8" />
      <path d="M12 20h.01" />
    </>
  ),
};

/**
 * Pantalla completa del resultado: el color se lee desde lejos, el nombre y el tipo
 * de entrada se leen de cerca. La barra de abajo se vacía mientras se cierra sola.
 */
function ResultScreen({ outcome, onClose }: { outcome: Outcome; onClose: () => void }) {
  let tone: string;
  let icon: keyof typeof icons;
  let heading: string;
  let name: string | null = null;
  let chip: string | null = null;
  let detail: string | null = null;
  switch (outcome.kind) {
    case "admitted":
      tone = "puerta-ok";
      icon = "ok";
      heading = "Adelante";
      name = outcome.holderName;
      chip = outcome.ticketType;
      break;
    case "already_used":
      tone = "puerta-no";
      icon = "used";
      heading = "Ya ingresó";
      name = outcome.holderName;
      chip = outcome.ticketType;
      detail = `Entró a las ${formatTime(outcome.usedAt)}${outcome.usedBy ? ` · lo escaneó ${outcome.usedBy}` : ""}`;
      break;
    case "wrong_event":
      tone = "puerta-aviso";
      icon = "date";
      heading = "Es de otra fecha";
      name = outcome.title;
      detail = formatNight(outcome.startsAt);
      break;
    case "invalid":
      tone = "puerta-no";
      icon = "no";
      heading = "Entrada no válida";
      detail = "No es una entrada de este boliche.";
      break;
    default:
      tone = "puerta-error";
      icon = "offline";
      heading = "Sin conexión";
      detail = "No sabemos si quedó registrada. Escaneala de nuevo: si ya había entrado, va a decir «Ya ingresó».";
  }
  return (
    <button
      type="button"
      onClick={onClose}
      role="alert"
      className={`puerta-resultado fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center ${tone}`}
      style={{ "--dur": `${RESULT_MS}ms` } as React.CSSProperties}
    >
      <span className="puerta-icono grid size-36 place-items-center rounded-full">
        <svg viewBox="0 0 24 24" aria-hidden className="size-20 fill-none stroke-current" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          {icons[icon]}
        </svg>
      </span>
      <span className="puerta-texto mt-8 flex max-w-full flex-col items-center gap-3">
        <span className="display break-words text-5xl uppercase">{heading}</span>
        {name && <span className="max-w-full break-words text-3xl font-bold">{name}</span>}
        {chip && <span className="rounded-full bg-black/25 px-4 py-1.5 text-lg font-semibold">{chip}</span>}
        {detail && <span className="max-w-xs text-lg opacity-90 first-letter:uppercase">{detail}</span>}
      </span>
      <span className="absolute inset-x-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        <span className="text-base opacity-80">Tocá para seguir</span>
        <span className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-black/20" aria-hidden>
          <span className="puerta-cuenta block h-full rounded-full bg-current" />
        </span>
      </span>
    </button>
  );
}
