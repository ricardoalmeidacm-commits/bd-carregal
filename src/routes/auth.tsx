import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Marca } from "@/components/Marca";
import { useSessao } from "@/hooks/useSessao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área reservada — Biblioteca Digital do Museu" },
      { name: "description", content: "Acesso à administração da Biblioteca Digital do Museu Municipal." },
      { property: "og:title", content: "Área reservada — Biblioteca Digital do Museu" },
      { property: "og:description", content: "Acesso reservado à equipa do Museu Municipal de Carregal do Sal." },
    ],
  }),
  component: Autenticacao,
});

function Autenticacao() {
  const navigate = useNavigate();
  const { sessao, carregado } = useSessao();
  const [modo, setModo] = useState<"entrar" | "registar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (carregado && sessao) navigate({ to: "/admin", replace: true });
  }, [carregado, sessao, navigate]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.rpc("ensure_profile");
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) {
          await supabase.rpc("ensure_profile");
          navigate({ to: "/admin", replace: true });
        } else {
          toast.success("Conta criada. Confirme o email para poder entrar.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o pedido");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Marca size={56} className="mx-auto" />
          <p className="eyebrow mt-4">Museu Municipal de Carregal do Sal</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Área reservada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso exclusivo à equipa de gestão da Biblioteca Digital.
          </p>
        </div>

        <form onSubmit={submeter} className="surface-card mt-6 space-y-3 p-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Palavra-passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={ocupado}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {ocupado ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
          <button
            type="button"
            onClick={() => setModo(modo === "entrar" ? "registar" : "entrar")}
            className="w-full text-center text-xs text-muted-foreground"
          >
            {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
          {modo === "entrar" && (
            <button
              type="button"
              onClick={async () => {
                if (!email) return toast.error("Indique primeiro o email");
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error(error.message);
                else toast.success("Enviámos um email para redefinir a palavra-passe.");
              }}
              className="w-full text-center text-xs text-primary"
            >
              Esqueci-me da palavra-passe
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
