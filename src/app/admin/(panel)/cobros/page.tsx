import type { Metadata } from "next";
import { HOME_VENUE, hasLiveCatalog } from "@/lib/catalog";
import { getStaffSession, panelMembership } from "@/lib/staff-session";
import { PaymentAccountsPanel } from "../../_components/payment-accounts";
import { getPaymentAccounts } from "../../_lib/server";

export const metadata: Metadata = { title: "Cobros" };

/** Cuentas con las que cobra el boliche. Al volver de Mercado Pago llega con ?mp=connected o ?mp=error&reason=. */
export default async function CobrosPage({ searchParams }: PageProps<"/admin/cobros">) {
  const params = await searchParams;
  const mpReturn = {
    result: typeof params.mp === "string" ? params.mp : null,
    reason: typeof params.reason === "string" ? params.reason : null,
  };
  if (!hasLiveCatalog()) {
    return <PaymentAccountsPanel venue="" initial={null} error="demo" mpReturn={mpReturn} />;
  }
  const session = await getStaffSession();
  const membership = session ? panelMembership(session, HOME_VENUE) : null;
  // El layout ya manda a otro lado a quien no administra.
  if (!membership) return null;
  const result = await getPaymentAccounts(membership.venue.slug);
  return (
    <PaymentAccountsPanel
      venue={membership.venue.slug}
      initial={result.ok ? result.data : null}
      error={result.ok ? null : result.error}
      mpReturn={mpReturn}
    />
  );
}
