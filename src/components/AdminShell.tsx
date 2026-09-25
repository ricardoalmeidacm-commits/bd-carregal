import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileStack, Users, LogOut, Tags } from "lucide-react";
import type { ReactNode } from "react";

import { Marca } from "@/components/Marca";
import { usePapeis, useSessao } from "@/hooks/useSessao";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/admin/folhetos", label: "Folhetos", icon: FileStack },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/utilizadores", label: "Utilizadores", icon: Users },
] as const;

export function AdminShell({
  children,
  titulo,
  subtitulo,
  exigirAdmin = false,
}: {
  children: ReactNode;
  titulo: string;
  subtitulo?: string | undefined;
  exigirAdmin?: boolean;
}) {
  const { sessao } = useSessao();
  const papeis = usePapeis(sessao?.user.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isAdmin = papeis.data?.includes("admin") ?? false;
  const isEditor = isAdmin || (papeis.data?.includes("editor") ?? false);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const semPermissao = papeis.isSuccess && (exigirAdmin ? !isAdmin : !isEditor);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="app-shell flex items-center gap-3 py-3">
          <Marca size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Backoffice
            </p>
            <p className="truncate font-display text-sm font-semibold text-primary">
              {sessao?.user.email}
            </p>
          </div>
          <button
            onClick={sair}
            aria-label="Terminar sessão"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <div className="app-shell pt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>

      <main className="app-shell py-4">
        {papeis.isLoading ? (
          <div className="surface-card h-40 animate-pulse bg-muted/50" />
        ) : semPermissao ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            A sua conta não tem permissões para esta área. Contacte o administrador do museu.
          </p>
        ) : (
          children
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 hairline-top bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="app-shell flex items-stretch justify-between py-1.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const ativo = to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[0.68rem] font-medium",
                  ativo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={ativo ? 2.4 : 1.8} />
                {label}
              </Link>
            );
          })}
          <Link
            to="/"
            className="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[0.68rem] font-medium text-muted-foreground"
          >
            <Marca size={20} />
            Site
          </Link>
        </div>
      </nav>
    </div>
  );
}
