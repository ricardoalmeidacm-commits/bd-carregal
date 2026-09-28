import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Heart, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { MarcaHorizontal } from "@/components/Marca";
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
  subtitulo?: string | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass-bar sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="app-shell flex items-center gap-3 py-2.5">
          <Link to="/" className="flex items-center" aria-label="Início">
            <MarcaHorizontal height={36} />
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

      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="glass-nav mx-auto flex max-w-[26rem] items-stretch justify-between p-1.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const ativo = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[0.66rem] font-medium transition-all duration-300",
                  ativo ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={ativo ? 2.3 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
