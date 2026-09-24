export type Flyer = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  thumbnail_url: string | null;
  pdf_url: string | null;
  visualizacoes: number;
  destaque: boolean;
  ativo: boolean;
  data_publicacao: string;
  created_at: string;
  updated_at: string;
};

export type Categoria = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
};

export const CATEGORIA_ICONES: Record<string, string> = {
  Património: "Landmark",
  História: "ScrollText",
  Arqueologia: "Pickaxe",
  Museu: "Building2",
  Turismo: "Map",
  Exposições: "Frame",
  Eventos: "CalendarDays",
  Publicações: "BookOpen",
};
