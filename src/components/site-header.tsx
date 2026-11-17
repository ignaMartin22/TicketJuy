import { Brand } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-linea bg-noche/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <a
            href="#moon"
            className="rounded-full px-3 py-2 text-tenue hover:text-luz"
          >
            Moon
          </a>
          <a
            href="#como-funciona"
            className="hidden rounded-full px-3 py-2 text-tenue hover:text-luz sm:block"
          >
            Cómo funciona
          </a>
          <a
            href="#sumate"
            className="neon-soft whitespace-nowrap rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground"
          >
            Sumá tu boliche
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-linea">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <Brand />
          <p className="mt-2 text-sm text-tenue">
            Entradas para la noche de Jujuy. Hecho en San Salvador.
          </p>
          <nav className="mt-4 flex gap-5 text-sm">
            <a href="#moon" className="text-tenue hover:text-luz">Moon</a>
            <a href="#como-funciona" className="text-tenue hover:text-luz">Cómo funciona</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
