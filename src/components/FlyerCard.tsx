import { Link } from "@tanstack/react-router";
import { Eye, FileText } from "lucide-react";

import type { Flyer } from "@/lib/types";

export function dataPt(valor: string) {
  try {
    return new Date(valor).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return valor;
  }
}

function Capa({ flyer, capa }: { flyer: Flyer; capa?: string | undefined }) {
  return capa ? (
    <img
      src={capa}
      alt={flyer.titulo}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
    />
  ) : (
    <div className="paper-texture flex h-full w-full items-center justify-center text-primary/40">
      <FileText className="size-8" />
    </div>
  );
}

/** Cartão vertical tipo "capa de livro", para carrosséis horizontais. */
export function FlyerPoster({
  flyer,
  capa,
  rank,
}: {
  flyer: Flyer;
  capa?: string | undefined;
  rank?: number;
}) {
  return (
    <Link
      to="/flyer/$slug"
      params={{ slug: flyer.slug }}
      className="group relative block w-[9.5rem] shrink-0 snap-start sm:w-[11rem]"
    >
      <div className="poster-cover relative aspect-[3/4] overflow-hidden">
        <Capa flyer={flyer} capa={capa} />
        <div className="poster-veil absolute inset-0" />
        <span className="glass-chip absolute left-2 top-2">{flyer.categoria}</span>
        {rank != null && (
          <span className="absolute bottom-1 left-2 font-display text-5xl font-bold leading-none text-primary-foreground/90 drop-shadow">
            {rank}
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[0.68rem] font-semibold text-primary-foreground">
          <Eye className="size-3.5" /> {flyer.visualizacoes}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 font-display text-[0.92rem] font-semibold leading-snug">
        {flyer.titulo}
      </h3>
      <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{dataPt(flyer.data_publicacao)}</p>
    </Link>
  );
}

/** Cartão largo de destaque. */
export function FlyerFeature({ flyer, capa }: { flyer: Flyer; capa?: string | undefined }) {
  return (
    <Link
      to="/flyer/$slug"
      params={{ slug: flyer.slug }}
      className="group relative block aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-[1.4rem] shadow-lift sm:w-[20rem]"
    >
      <Capa flyer={flyer} capa={capa} />
      <div className="feature-veil absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
        <span className="glass-chip">{flyer.categoria}</span>
        <h3 className="mt-2 line-clamp-3 font-display text-xl font-semibold leading-tight">
          {flyer.titulo}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[0.7rem] opacity-90">
          <span>{dataPt(flyer.data_publicacao)}</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" /> {flyer.visualizacoes}
          </span>
          <span className="ml-auto rounded-full bg-primary-foreground px-3 py-1 font-semibold text-primary">
            Ler agora
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Cartão em lista (biblioteca, favoritos). */
export function FlyerCard({ flyer, capa }: { flyer: Flyer; capa?: string | undefined }) {
  return (
    <Link
      to="/flyer/$slug"
      params={{ slug: flyer.slug }}
      className="group surface-card flex gap-3 overflow-hidden p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.99]"
    >
      <div className="poster-cover relative h-32 w-24 shrink-0 overflow-hidden">
        <Capa flyer={flyer} capa={capa} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <span className="eyebrow text-primary">{flyer.categoria}</span>
        <h3 className="mt-1 line-clamp-2 font-display text-[1.02rem] font-semibold leading-snug">
          {flyer.titulo}
        </h3>
        {flyer.descricao && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{flyer.descricao}</p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[0.7rem] text-muted-foreground">
          <span>{dataPt(flyer.data_publicacao)}</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" /> {flyer.visualizacoes}
          </span>
          <span className="ml-auto rounded-full bg-primary px-3 py-1 text-[0.7rem] font-semibold text-primary-foreground">
            Consultar
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FlyerCardSkeleton() {
  return <div className="surface-card h-[9.5rem] animate-pulse bg-muted/60" />;
}

export function PosterSkeleton() {
  return (
    <div className="w-[9.5rem] shrink-0 sm:w-[11rem]">
      <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}
