import { Link } from "@tanstack/react-router";
import { Eye, FileText } from "lucide-react";

import type { Flyer } from "@/lib/types";

function dataPt(valor: string) {
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

export function FlyerCard({ flyer, capa }: { flyer: Flyer; capa?: string | undefined }) {
  return (
    <Link
      to="/flyer/$slug"
      params={{ slug: flyer.slug }}
      className="surface-card flex gap-3 overflow-hidden p-3 transition-transform active:scale-[0.99]"
    >
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {capa ? (
          <img src={capa} alt={flyer.titulo} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <FileText className="size-6" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
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
  return <div className="surface-card h-[8.5rem] animate-pulse bg-muted/60" />;
}
