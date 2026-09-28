DROP FUNCTION IF EXISTS public.registar_visualizacao(text);
CREATE FUNCTION public.registar_visualizacao(_slug text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE novo integer;
BEGIN
  UPDATE public.flyers SET visualizacoes = visualizacoes + 1
  WHERE slug = _slug AND ativo = true
  RETURNING visualizacoes INTO novo;
  RETURN COALESCE(novo, 0);
END $$;
GRANT EXECUTE ON FUNCTION public.registar_visualizacao(text) TO anon, authenticated;