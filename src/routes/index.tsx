import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FlyerCard, FlyerCardSkeleton } from "@/components/FlyerCard";
import { useSignedUrls } from "@/hooks/useSignedUrls";
import { supabase } from "@/integrations/supabase/client";
import type { Categoria, Flyer } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biblioteca Digital — Museu Municipal de Carregal do Sal" },
      {
        name: "description",
        content:
          "Consulte no telemóvel os folhetos, roteiros, exposições e publicações do Museu Municipal de Carregal do Sal.",
      },
      { property: "og:title", content: "Biblioteca Digital do Museu Municipal de Carregal do Sal" },
      {
        property: "og:description",
        content: "Folhetos, roteiros, exposições e publicações em PDF, otimizados para telemóvel.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");

  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("*").order("ordem");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const recentes = useQuery({
    queryKey: ["flyers", "recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as Flyer[];
    },
  });

  const populares = useQuery({
    queryKey: ["flyers", "populares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .eq("ativo", true)
        .order("visualizacoes", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as Flyer[];
    },
  });

  const capaDe = useSignedUrls([
    ...(recentes.data ?? []).map((f) => f.thumbnail_url),
    ...(populares.data ?? []).map((f) => f.thumbnail_url),
  ]);

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/biblioteca", search: { q: termo || undefined, cat: undefined } });
  }

  return (
    <AppShell>
      <section className="pt-2 text-center">
        <p className="eyebrow">Museu Municipal de Carregal do Sal</p>
        <h1 className="mt-1 font-display text-[2.1rem] font-semibold leading-[1.1] tracking-tight">
          Biblioteca Digital
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Folhetos, roteiros, exposições e publicações do Museu Municipal de Carregal do Sal.
        </p>
      </section>

      <form onSubmit={pesquisar} className="mt-6">
        <label className="surface-card flex items-center gap-2 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Pesquisar por título, categoria ou tema"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Categorias</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {(categorias.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/biblioteca"
              search={{ cat: c.nome, q: undefined }}
              className="surface-card px-3 py-3.5 text-sm font-medium transition-colors active:bg-secondary"
            >
              <span className="block text-primary">{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Últimos folhetos</h2>
        </div>
        <div className="mt-3 space-y-3">
          {recentes.isLoading && [0, 1, 2].map((i) => <FlyerCardSkeleton key={i} />)}
          {recentes.data?.length === 0 && (
            <p className="surface-card p-4 text-sm text-muted-foreground">
              Ainda não existem folhetos publicados.
            </p>
          )}
          {(recentes.data ?? []).map((f) => (
            <FlyerCard key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
          ))}
        </div>
      </section>

      {(populares.data?.length ?? 0) > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Mais consultados</h2>
          </div>
          <div className="mt-3 space-y-3">
            {(populares.data ?? []).map((f) => (
              <FlyerCard key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
