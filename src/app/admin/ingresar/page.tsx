import { Suspense } from "react";
import { redirect } from "next/navigation";

/** El ingreso pasó a /ingresar (lo comparten panel y portería): los links viejos siguen andando. */
export default function AdminIngresar({ searchParams }: PageProps<"/admin/ingresar">) {
  // Los parámetros de la URL se leen dentro de Suspense (cacheComponents no deja prerenderizar sin él).
  return (
    <Suspense>
      <Redirect searchParams={searchParams} />
    </Suspense>
  );
}

async function Redirect({ searchParams }: { searchParams: PageProps<"/admin/ingresar">["searchParams"] }): Promise<null> {
  const { desde } = await searchParams;
  const pedido = typeof desde === "string" ? desde : "";
  redirect(pedido ? `/ingresar?desde=${encodeURIComponent(pedido)}` : "/ingresar");
  return null;
}
