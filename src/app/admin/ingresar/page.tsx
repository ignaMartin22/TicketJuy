import { redirect } from "next/navigation";

/** El ingreso pasó a /ingresar (lo comparten panel y portería): los links viejos siguen andando. */
export default async function AdminIngresar({ searchParams }: PageProps<"/admin/ingresar">) {
  const { desde } = await searchParams;
  const pedido = typeof desde === "string" ? desde : "";
  redirect(pedido ? `/ingresar?desde=${encodeURIComponent(pedido)}` : "/ingresar");
}
