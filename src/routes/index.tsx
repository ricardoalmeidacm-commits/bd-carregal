import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Compass, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FlyerFeature, FlyerPoster, PosterSkeleton } from "@/components/FlyerCard";
import { Marca } from "@/components/Marca";
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
          "Folhetos, roteiros, património, história e publicações do Museu Municipal de Carregal do Sal, para ler no telemóvel.",
      },
      { property: "og:title", content: "Biblioteca Digital do Museu Municipal de Carregal do Sal" },
      {
        property: "og:description",
        content: "Descubra e leia folhetos, roteiros e publicações do museu diretamente no telemóvel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const SECCOES_CATEGORIA = ["Património", "História", "Turismo", "Exposições", "Eventos"];

function Inicio() {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [abrirCats, setAbrirCats] = useState(false);

  // Uma única consulta leve para todas as secções.
  const flyers = useQuery({
    queryKey: ["flyers", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flyers")
        .select(
          "id,titulo,slug,descricao,categoria,thumbnail_url,pdf_url,visualizacoes,destaque,ativo,data_publicacao,created_by,created_at,updated_at",
        )
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false })
        .limit(120);
      if (error) throw error;
      return data as Flyer[];
    },
    staleTime: 60_000,
  });

  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("*").order("ordem");
      if (error) throw error;
      return data as Categoria[];
    },
    staleTime: 5 * 60_000,
  });

  const todos = flyers.data ?? [];
  const seccoes = useMemo(() => {
    const destaques = todos.filter((f) => f.destaque);
    const recentes = todos.slice(0, 12);
    const populares = [...todos].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 10);
    const porCat = SECCOES_CATEGORIA.map((c) => ({
      nome: c,
      itens: todos.filter((f) => f.categoria === c).slice(0, 12),
    })).filter((s) => s.itens.length > 0);
    return {
      destaques: destaques.length ? destaques : recentes.slice(0, 5),
      recentes,
      populares,
      porCat,
    };
  }, [todos]);

  const capaDe = useSignedUrls(todos.map((f) => f.thumbnail_url));
  const contagem = useMemo(() => {
    const m = new Map<string, number>();
    todos.forEach((f) => m.set(f.categoria, (m.get(f.categoria) ?? 0) + 1));
    return m;
  }, [todos]);

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/biblioteca", search: { q: termo || undefined, cat: undefined } });
  }

  const aCarregar = flyers.isLoading;

  return (
    <AppShell>
      {/* 1. Hero */}
      <section className="hero-panel relative -mx-5 -mt-4 overflow-hidden px-5 pb-7 pt-8">
        <div className="heritage-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-start animate-fade-in">
          <div className="flex items-center gap-3">
            <Marca size={52} className="drop-shadow-sm" />
            <div className="h-9 w-px bg-border" />
            <p className="eyebrow leading-tight">
              Museu Municipal
              <br />
              de Carregal do Sal
            </p>
          </div>
          <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight">
            Biblioteca
            <br />
            <span className="text-gradient-brand italic">Digital</span>
          </h1>
          <p className="mt-3 max-w-[22rem] text-[0.93rem] leading-relaxed text-muted-foreground">
            Folhetos, roteiros, património, história e publicações do Museu Municipal de Carregal do
            Sal.
          </p>
          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="font-display text-lg text-foreground">{todos.length || "—"}</strong>{" "}
              publicações
            </span>
            <span className="h-4 w-px bg-border" />
            <span>
              <strong className="font-display text-lg text-foreground">
                {categorias.data?.length ?? "—"}
              </strong>{" "}
              temas
            </span>
          </div>

          <form onSubmit={pesquisar} className="mt-5 w-full">
            <label className="glass-input flex items-center gap-2 px-3.5 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Pesquisar publicações"
                aria-label="Pesquisar publicações"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          </form>
        </div>
      </section>

      {/* 2. Destaques */}
      <Rail titulo="Em Destaque" subtitulo="Seleção do museu" variante="feature">
        {aCarregar
          ? [0, 1].map((i) => (
              <div key={i} className="aspect-[4/5] w-[78%] shrink-0 animate-pulse rounded-[1.4rem] bg-muted" />
            ))
          : seccoes.destaques.map((f) => (
              <FlyerFeature key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
            ))}
      </Rail>

      {/* 3. Últimos adicionados */}
      <Rail titulo="Últimos Adicionados" verTodos={{}}>
        {aCarregar
          ? [0, 1, 2].map((i) => <PosterSkeleton key={i} />)
          : seccoes.recentes.map((f) => <FlyerPoster key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />)}
      </Rail>

      {/* 4. Mais consultados */}
      {seccoes.populares.length > 0 && (
        <Rail titulo="Mais Consultados" subtitulo="O que os visitantes mais leem">
          {seccoes.populares.map((f, i) => (
            <FlyerPoster key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} rank={i + 1} />
          ))}
        </Rail>
      )}

      {/* 5. Biblioteca por tema */}
      {seccoes.porCat.map((s) => (
        <Rail key={s.nome} titulo={s.nome} verTodos={{ cat: s.nome }}>
          {s.itens.map((f) => (
            <FlyerPoster key={f.id} flyer={f} capa={capaDe(f.thumbnail_url)} />
          ))}
        </Rail>
      ))}

      {!aCarregar && todos.length === 0 && (
        <p className="surface-card mt-8 p-5 text-sm text-muted-foreground">
          Ainda não existem folhetos publicados.
        </p>
      )}

      {/* 6. Explorar categorias (secundário, recolhível) */}
      <section className="mt-10">
        <button
          onClick={() => setAbrirCats((v) => !v)}
          aria-expanded={abrirCats}
          className="surface-card flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
            <Compass className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Explorar Categorias</span>
            <span className="block text-xs text-muted-foreground">Navegue por tema</span>
          </span>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-300 ${abrirCats ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`grid transition-all duration-300 ease-out ${abrirCats ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-2 pt-1">
              {(categorias.data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/biblioteca"
                  search={{ cat: c.nome, q: undefined }}
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {c.nome}
                  <span className="ml-1.5 text-muted-foreground">{contagem.get(c.nome) ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Rodapé */}
      <footer className="mt-12 border-t border-border pt-6 text-center">
        <Marca size={36} className="mx-auto opacity-80" />
        <p className="mt-3 text-xs text-muted-foreground">
          Museu Municipal de Carregal do Sal · Biblioteca Digital
        </p>
        <p className="mt-1 text-[0.68rem] text-muted-foreground/80">
          © {new Date().getFullYear()} Município de Carregal do Sal
        </p>
      </footer>
    </AppShell>
  );
}

function Rail({
  titulo,
  subtitulo,
  children,
  verTodos,
  variante,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  verTodos?: { cat?: string };
  variante?: "feature";
}) {
  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="section-title font-display text-[1.28rem] font-semibold leading-tight">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        {verTodos && (
          <Link
            to="/biblioteca"
            search={{ cat: verTodos.cat, q: undefined }}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
          >
            Ver todos <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      <div
        className={`no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory overflow-x-auto scroll-px-5 px-5 pb-2 ${variante === "feature" ? "gap-3.5" : "gap-3"}`}
      >
        {children}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}
