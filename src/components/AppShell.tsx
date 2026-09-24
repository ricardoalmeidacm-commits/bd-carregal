import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Heart, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { Marca } from "@/components/Marca";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/admin", label: "Reservado", icon: Lock },
] as const;

export function AppShell({
  children,
  titulo,
  subtitulo,
}: {
  children: ReactNode;
  titulo?: string;
  subtitulo?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="app-shell flex items-center gap-3 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Marca size={36} />
            <span className="leading-tight">
              <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Museu Municipal
              </span>
              <span className="block font-display text-[0.95rem] font-semibold text-primary">
                Carregal do Sal
              </span>
            </span>
          </Link>
        </div>
      </header>

      {(titulo || subtitulo) && (
        <div className="app-shell pt-6 pb-2">
          {titulo && <h1 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h1>}
          {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
      )}

      <main className="app-shell py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 hairline-top bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="app-shell flex items-stretch justify-between py-1.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const ativo = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[0.68rem] font-medium transition-colors",
                  ativo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={ativo ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
