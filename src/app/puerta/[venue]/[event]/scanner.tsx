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

  const link = "inline-flex min-h-12 items-center rounded-full border border-linea px-4 text-base font-semibold";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-col gap-2 px-4 pb-3 pt-4">
        <h1 className="display break-words text-2xl">{title}</h1>
        <p className="display text-3xl tabular-nums" aria-live="polite">
          Ingresaron {total.admitted} de {total.issued}
        </p>
        <nav className="flex flex-wrap gap-2">
          <Link href={`/puerta/${venue}/${event}/asistencia`} className={link}>
            Asistencia
          </Link>
          <Link href="/puerta" className={link}>
            Cambiar de fecha
          </Link>
        </nav>
      </header>

      <div className="relative mx-4 aspect-[3/4] max-h-[60dvh] overflow-hidden rounded-3xl border border-linea bg-noche-2 sm:mx-auto sm:w-full sm:max-w-md">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label="Cámara para leer el QR" />
        <canvas ref={canvasRef} className="hidden" />
        {camera === "on" && (
          <div aria-hidden className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-luz/60" />
        )}
        {camera === "starting" && <p className="absolute inset-0 grid place-items-center text-tenue">Abriendo la cámara...</p>}
        {camera !== "starting" && camera !== "on" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-noche-2 p-5 text-center">
            <p>{CAMERA_MESSAGES[camera]}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="min-h-12 rounded-full bg-luz px-6 text-base font-semibold text-noche"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
      <p className="px-4 pt-3 text-center text-sm text-tenue">
        {pending ? "Revisando..." : "Apuntá la cámara al QR de la entrada."}
      </p>

      <details className="mx-4 mt-3 pb-8 sm:mx-auto sm:w-full sm:max-w-md">
        <summary className="flex min-h-12 cursor-pointer items-center font-semibold">Ingresar código a mano</summary>
        <form
          className="mt-2 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const code = manual;
            setManual("");
            void submit(code);
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Texto del QR
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-12 w-full rounded-xl border border-linea bg-noche-2 px-4 text-base text-luz focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !manual.trim()}
            className="min-h-12 rounded-full bg-luz px-6 text-base font-semibold text-noche disabled:opacity-60"
          >
            Revisar
          </button>
        </form>
      </details>

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

function ResultScreen({ outcome, onClose }: { outcome: Outcome; onClose: () => void }) {
  let tone: string;
  let icon: keyof typeof icons;
  let heading: string;
  let lines: string[] = [];
  switch (outcome.kind) {
    case "admitted":
      tone = "bg-emerald-700 text-white";
      icon = "ok";
      heading = "Adelante";
      lines = [outcome.holderName, outcome.ticketType];
      break;
    case "already_used":
      tone = "bg-red-700 text-white";
      icon = "used";
      heading = "Ya ingresó";
      lines = [
        outcome.holderName,
        outcome.ticketType,
        `Entró a las ${formatTime(outcome.usedAt)}${outcome.usedBy ? ` · lo escaneó ${outcome.usedBy}` : ""}`,
      ];
      break;
    case "wrong_event":
      tone = "bg-amber-400 text-noche";
      icon = "date";
      heading = "Es de otra fecha";
      lines = [outcome.title, formatNight(outcome.startsAt)];
      break;
    case "invalid":
      tone = "bg-red-700 text-white";
      icon = "no";
      heading = "Entrada no válida";
      break;
    default:
      tone = "bg-zinc-700 text-white";
      icon = "offline";
      heading = "Sin conexión. Probá de nuevo.";
  }
  return (
    <button
      type="button"
      onClick={onClose}
      role="alert"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-6 text-center ${tone}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-32 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {icons[icon]}
      </svg>
      <span className="display break-words text-5xl">{heading}</span>
      {lines.map((l, i) => (
        <span key={i} className={`max-w-full break-words ${i === 0 ? "text-3xl font-bold" : "text-xl"}`}>
          {l}
        </span>
      ))}
      <span className="mt-4 text-base opacity-80">Tocá para seguir</span>
    </button>
  );
}
