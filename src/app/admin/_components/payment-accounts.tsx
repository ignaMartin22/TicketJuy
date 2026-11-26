"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import {
  connectMercadoPago,
  disconnectMercadoPago,
  removeGateway,
  saveGateway,
  type GatewayProvider,
  type GatewayStatus,
  type PaymentAccounts,
} from "../_lib/server";
import { ConfirmDialog } from "./confirm-dialog";
import { buttonClass, Card, PageHeader } from "./ui";

const MP_RETURN: Record<string, string> = {
  denied: "Cancelaste la autorización en Mercado Pago. No se vinculó nada.",
  invalid_state: "El link de Mercado Pago venció (dura 10 minutos). Probá de nuevo.",
  exchange_failed: "Mercado Pago no confirmó la vinculación. Probá de nuevo en un rato.",
  not_configured: "Mercado Pago todavía no está habilitado en TicketJuy. Avisanos.",
};

const ERRORS: Record<string, string> = {
  expired: "Tu sesión venció. Volvé a ingresar.",
  network: "No pudimos hablar con el servidor. Probá de nuevo.",
  missing_credentials: "Completá todos los datos obligatorios.",
  invalid_credentials: "Algún dato no es válido. Revisalo y probá de nuevo.",
  gateway_not_configured: "Esta forma de cobro todavía no está habilitada en TicketJuy. Avisanos.",
  mp_not_configured: "Mercado Pago todavía no está habilitado en TicketJuy. Avisanos.",
  not_found: "No tenés permiso para cambiar los cobros de este boliche.",
  demo: "En la demostración no se pueden vincular cuentas.",
};

const message = (code: string) => ERRORS[code] ?? ERRORS.network;

const GATEWAYS: Record<GatewayProvider, { name: string; intro: string; howTo: string[] }> = {
  macro: {
    name: "Macro Click de Pago",
    intro: "Tarjetas de débito y crédito con el botón de pago del Banco Macro. La plata entra a tu cuenta Macro.",
    howTo: [
      "Necesitás cuenta en Banco Macro.",
      "Pedile a tu oficial de cuentas el alta del \"Botón Integrado\" de Click de Pago.",
      "El banco te manda por mail el ID de comercio y la clave secreta, de prueba y de producción.",
    ],
  },
  nave: {
    name: "Naranja X / Nave",
    intro: "Tarjetas, Naranja X y transferencias con Nave (Naranja X y Galicia). La plata entra a tu cuenta de Nave.",
    howTo: [
      "Necesitás cuenta de comercio en Naranja X o en Galicia.",
      "En Nave, entrá a Integraciones › Tienda online propia y activá el código de vinculación.",
      "Mandalo con tu CUIT a integraciones@navenegocios.com pidiendo el alta de \"Online · Checkout\".",
      "Nave te devuelve el Client ID, el Client secret y el POS ID.",
    ],
  },
};

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "";

export function PaymentAccountsPanel({
  venue,
  initial,
  error,
  mpReturn,
}: {
  venue: string;
  initial: PaymentAccounts | null;
  error: string | null;
  mpReturn: { result: string | null; reason: string | null };
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [notice] = useState(() =>
    mpReturn.result === "connected"
      ? { ok: true, text: "Listo: Mercado Pago quedó vinculado. Las próximas ventas entran a tu cuenta." }
      : mpReturn.result === "error"
        ? { ok: false, text: MP_RETURN[mpReturn.reason ?? ""] ?? MP_RETURN.exchange_failed }
        : null,
  );

  // El resultado de Mercado Pago se muestra una vez: se saca de la URL para que no vuelva al recargar.
  useEffect(() => {
    if (mpReturn.result) router.replace("/admin/cobros", { scroll: false });
  }, [mpReturn.result, router]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cobros"
        description="Vinculá las cuentas donde querés recibir la plata de las entradas. El comprador elige con cuál pagar."
      />
      {notice && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${notice.ok ? "border-accent/50 bg-accent/10" : "border-error/40 text-error"}`}
        >
          {notice.text}
        </p>
      )}
      {!accounts ? (
        <Card className="p-6 text-tenue">{message(error ?? "network")}</Card>
      ) : (
        <>
          <MercadoPagoCard venue={venue} status={accounts.mercadopago} onChange={setAccounts} />
          {(["macro", "nave"] as const).map((p) => (
            <GatewayCard key={p} venue={venue} provider={p} status={accounts[p]} onChange={setAccounts} />
          ))}
          {!accounts.mercadopago.connected && !accounts.macro.connected && !accounts.nave.connected && (
            <p className="text-sm text-tenue">
              Sin ninguna cuenta vinculada, la web no puede cobrar: las fechas pagas no se pueden comprar.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${on ? "bg-accent/15 text-accent" : "bg-white/5 text-tenue"}`}
    >
      <span className={`size-1.5 rounded-full ${on ? "bg-accent" : "bg-tenue/60"}`} aria-hidden />
      {children}
    </span>
  );
}

function MercadoPagoCard({
  venue,
  status,
  onChange,
}: {
  venue: string;
  status: PaymentAccounts["mercadopago"];
  onChange: Dispatch<SetStateAction<PaymentAccounts | null>>;
}) {
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const connect = () =>
    start(async () => {
      setProblem(null);
      const result = await connectMercadoPago(venue);
      if (result.ok) window.location.assign(result.data);
      else setProblem(message(result.error));
    });

  const disconnect = () =>
    start(async () => {
      setConfirm(false);
      const result = await disconnectMercadoPago(venue);
      if (result.ok) {
        onChange((prev) => prev && {
          ...prev,
          mercadopago: { ...prev.mercadopago, connected: false, needsReconnect: false, direct: false, liveMode: null, connectedAt: null },
        });
      }
      else setProblem(message(result.error));
    });

  const connected = status.connected && !status.needsReconnect;
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Mercado Pago</h2>
          <p className="mt-1 text-sm text-tenue">
            Tarjetas, dinero en cuenta y más. Te lleva a Mercado Pago para que autorices a TicketJuy a cobrar en tu
            nombre: no nos pasás ninguna clave.
          </p>
        </div>
        <Badge on={connected}>
          {status.needsReconnect ? "Hay que reconectar" : connected ? "Vinculada" : "Sin vincular"}
        </Badge>
      </div>

      {status.connected && (
        <p className="mt-4 text-sm">
          {status.liveMode === false ? "Cuenta de prueba" : "Cuenta real"}
          {status.connectedAt && ` · vinculada el ${date(status.connectedAt)}`}
        </p>
      )}
      {status.needsReconnect && (
        <p className="mt-2 text-sm text-error">Mercado Pago cortó la vinculación. Hasta que reconectes, no se puede pagar con Mercado Pago.</p>
      )}
      {!status.available && (
        <p className="mt-4 text-sm text-tenue">{ERRORS.mp_not_configured}</p>
      )}
      {problem && <p role="alert" className="mt-4 text-sm text-error">{problem}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {status.available && (!status.connected || status.needsReconnect) && (
          <button type="button" className={buttonClass.primary} disabled={pending} onClick={connect}>
            {pending ? "Abriendo Mercado Pago…" : status.needsReconnect ? "Reconectar Mercado Pago" : "Vincular Mercado Pago"}
          </button>
        )}
        {status.connected && (
          <button type="button" className={buttonClass.danger} disabled={pending} onClick={() => setConfirm(true)}>
            Desvincular
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title="¿Desvincular Mercado Pago?"
        body="Desde ahora nadie va a poder pagar con Mercado Pago hasta que vuelvas a vincular una cuenta. Lo que ya se cobró no cambia."
        confirmLabel="Desvincular"
        onConfirm={disconnect}
        onClose={() => setConfirm(false)}
      />
    </Card>
  );
}

function GatewayCard({
  venue,
  provider,
  status,
  onChange,
}: {
  venue: string;
  provider: GatewayProvider;
  status: GatewayStatus;
  onChange: Dispatch<SetStateAction<PaymentAccounts | null>>;
}) {
  const info = GATEWAYS[provider];
  const formId = useId();
  const [editing, setEditing] = useState(!status.connected);
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const submit = (form: FormData) =>
    start(async () => {
      setProblem(null);
      setSaved(false);
      const values: Record<string, string> = {};
      for (const field of status.fields) values[field.name] = String(form.get(field.name) ?? "");
      const result = await saveGateway(venue, provider, values, form.get("liveMode") === "on");
      if (result.ok) {
        onChange(result.data);
        setEditing(false);
        setSaved(true);
      } else {
        setProblem(message(result.error));
      }
    });

  const remove = () =>
    start(async () => {
      setConfirm(false);
      setSaved(false);
      const result = await removeGateway(venue, provider);
      if (result.ok) {
        setEditing(true);
        onChange((prev) => prev && {
          ...prev,
          [provider]: { ...prev[provider], connected: false, liveMode: null, accountId: "", connectedAt: null },
        });
      } else {
        setProblem(message(result.error));
      }
    });

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{info.name}</h2>
          <p className="mt-1 text-sm text-tenue">{info.intro}</p>
        </div>
        <Badge on={status.connected}>{status.connected ? "Vinculada" : "Sin vincular"}</Badge>
      </div>

      {status.connected && (
        <p className="mt-4 text-sm">
          {status.liveMode ? "Producción (cobra de verdad)" : "Entorno de prueba del banco (no cobra de verdad)"}
          {status.accountId && ` · ${provider === "macro" ? "comercio" : "POS"} ${status.accountId}`}
          {status.connectedAt && ` · cargada el ${date(status.connectedAt)}`}
        </p>
      )}
      {saved && <p role="status" className="mt-2 text-sm text-accent">Guardamos las credenciales.</p>}
      {problem && <p role="alert" className="mt-4 text-sm text-error">{problem}</p>}

      {!status.available ? (
        <p className="mt-4 text-sm text-tenue">{ERRORS.gateway_not_configured}</p>
      ) : editing ? (
        <form action={submit} className="mt-5 flex flex-col gap-4" aria-describedby={`${formId}-ayuda`}>
          <details id={`${formId}-ayuda`} className="rounded-xl border border-linea px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium">¿De dónde saco estos datos?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-tenue">
              {info.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
          <div className="grid gap-4 sm:grid-cols-2">
            {status.fields.map((field) => (
              <label key={field.name} className="flex flex-col gap-1.5 text-sm">
                <span>
                  {field.label}
                  {!field.required && <span className="text-tenue"> (opcional)</span>}
                </span>
                <input
                  name={field.name}
                  type={field.secret ? "password" : "text"}
                  required={field.required}
                  maxLength={200}
                  autoComplete="off"
                  spellCheck={false}
                  className="min-h-11 rounded-xl border border-linea bg-noche px-3 text-luz outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="liveMode" defaultChecked={status.liveMode ?? false} className="mt-1 size-4 accent-accent" />
            <span>
              Son credenciales de producción
              <span className="block text-tenue">Sin marcar, se usa el entorno de prueba del banco: no se cobra de verdad.</span>
            </span>
          </label>
          {status.connected && (
            <p className="text-xs text-tenue">Por seguridad no mostramos las claves guardadas: para cambiarlas, cargalas de nuevo.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass.primary} disabled={pending}>
              {pending ? "Guardando…" : "Guardar credenciales"}
            </button>
            {status.connected && (
              <button type="button" className={buttonClass.secondary} disabled={pending} onClick={() => setEditing(false)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={buttonClass.secondary} disabled={pending} onClick={() => setEditing(true)}>
            Cambiar credenciales
          </button>
          <button type="button" className={buttonClass.danger} disabled={pending} onClick={() => setConfirm(true)}>
            Desvincular
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title={`¿Desvincular ${info.name}?`}
        body="Se borran las credenciales y nadie va a poder pagar con este medio hasta que las cargues de nuevo."
        confirmLabel="Desvincular"
        onConfirm={remove}
        onClose={() => setConfirm(false)}
      />
    </Card>
  );
}
