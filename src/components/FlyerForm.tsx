import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { criarSlug } from "@/lib/slug";
import type { Categoria, Flyer } from "@/lib/types";

type Valores = {
  titulo: string;
  descricao: string;
  categoria: string;
  data_publicacao: string;
  destaque: boolean;
  ativo: boolean;
  thumbnail_url: string | null;
  pdf_url: string | null;
};

const campo =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

export function FlyerForm({ flyer }: { flyer?: Flyer }) {
  const navigate = useNavigate();
  const [v, setV] = useState<Valores>({
    titulo: flyer?.titulo ?? "",
    descricao: flyer?.descricao ?? "",
    categoria: flyer?.categoria ?? "",
    data_publicacao: flyer?.data_publicacao ?? new Date().toISOString().slice(0, 10),
    destaque: flyer?.destaque ?? false,
    ativo: flyer?.ativo ?? true,
    thumbnail_url: flyer?.thumbnail_url ?? null,
    pdf_url: flyer?.pdf_url ?? null,
  });
  const [ocupado, setOcupado] = useState(false);

  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias").select("*").order("ordem");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  async function carregarFicheiro(file: File, pasta: "capas" | "pdfs") {
    const ext = file.name.split(".").pop() ?? "bin";
    const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("flyers").upload(caminho, file, { upsert: false });
    if (error) throw error;
    return caminho;
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!v.categoria) {
      toast.error("Escolha uma categoria");
      return;
    }
    setOcupado(true);
    try {
      const payload = {
        titulo: v.titulo,
        descricao: v.descricao || null,
        categoria: v.categoria,
        data_publicacao: v.data_publicacao,
        destaque: v.destaque,
        ativo: v.ativo,
        thumbnail_url: v.thumbnail_url,
        pdf_url: v.pdf_url,
      };

      if (flyer) {
        const { error } = await supabase.from("flyers").update(payload).eq("id", flyer.id);
        if (error) throw error;
        toast.success("Folheto atualizado");
      } else {
        const base = criarSlug(v.titulo) || "folheto";
        const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase.from("flyers").insert({ ...payload, slug });
        if (error) throw error;
        toast.success("Folheto criado");
      }
      navigate({ to: "/admin/folhetos" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={guardar} className="surface-card space-y-4 p-5">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título</label>
        <input
          required
          value={v.titulo}
          onChange={(e) => setV({ ...v, titulo: e.target.value })}
          className={campo}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Descrição</label>
        <textarea
          rows={4}
          value={v.descricao}
          onChange={(e) => setV({ ...v, descricao: e.target.value })}
          className={campo}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Categoria</label>
        <select
          value={v.categoria}
          onChange={(e) => setV({ ...v, categoria: e.target.value })}
          className={campo}
        >
          <option value="">Escolher categoria</option>
          {(categorias.data ?? []).map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Data de publicação</label>
        <input
          type="date"
          value={v.data_publicacao}
          onChange={(e) => setV({ ...v, data_publicacao: e.target.value })}
          className={campo}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Imagem de capa</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setOcupado(true);
            try {
              const caminho = await carregarFicheiro(file, "capas");
              setV((atual) => ({ ...atual, thumbnail_url: caminho }));
              toast.success("Capa carregada");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Falha ao carregar a capa");
            } finally {
              setOcupado(false);
            }
          }}
          className={campo}
        />
        {v.thumbnail_url && <p className="mt-1 text-xs text-muted-foreground">Capa associada ✓</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Ficheiro PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setOcupado(true);
            try {
              const caminho = await carregarFicheiro(file, "pdfs");
              setV((atual) => ({ ...atual, pdf_url: caminho }));
              toast.success("PDF carregado");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Falha ao carregar o PDF");
            } finally {
              setOcupado(false);
            }
          }}
          className={campo}
        />
        {v.pdf_url && <p className="mt-1 text-xs text-muted-foreground">PDF associado ✓</p>}
      </div>

      <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
        Destaque
        <input
          type="checkbox"
          checked={v.destaque}
          onChange={(e) => setV({ ...v, destaque: e.target.checked })}
          className="size-4 accent-[oklch(0.483_0.143_25.5)]"
        />
      </label>

      <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
        Publicado (desligado = rascunho)
        <input
          type="checkbox"
          checked={v.ativo}
          onChange={(e) => setV({ ...v, ativo: e.target.checked })}
          className="size-4 accent-[oklch(0.483_0.143_25.5)]"
        />
      </label>

      <button
        type="submit"
        disabled={ocupado}
        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {ocupado ? "A guardar..." : flyer ? "Guardar alterações" : "Criar folheto"}
      </button>
    </form>
  );
}
