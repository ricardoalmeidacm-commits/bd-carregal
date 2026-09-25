import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";

type Perfil = { id: string; nome: string | null; email: string | null; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/utilizadores")({
  component: Utilizadores,
});

function Utilizadores() {
  const dados = useQuery({
    queryKey: ["admin", "utilizadores"],
    queryFn: async () => {
      const [{ data: perfis, error: e1 }, { data: papeis, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (perfis as Perfil[]).map((p) => ({
        ...p,
        papeis: (papeis ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      }));
    },
  });

  return (
    <AdminShell titulo="Utilizadores" subtitulo="Contas com acesso à área reservada" exigirAdmin>
      <div className="space-y-2">
        {dados.isLoading && <div className="surface-card h-20 animate-pulse bg-muted/50" />}
        {(dados.data ?? []).map((u) => (
          <div key={u.id} className="surface-card flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                Desde {new Date(u.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.68rem] font-semibold text-secondary-foreground">
              {u.papeis.join(", ") || "sem papel"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        A conta cmcsal@gmail.com recebe automaticamente permissões de administrador total no primeiro
        acesso.
      </p>
    </AdminShell>
  );
}
