import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSignedUrls } from "@/lib/storage.functions";

export function useSignedUrls(paths: (string | null | undefined)[]) {
  const fetchUrls = useServerFn(getSignedUrls);
  const clean = Array.from(new Set(paths.filter((p): p is string => !!p))).sort();

  const query = useQuery({
    queryKey: ["signed-urls", clean],
    queryFn: () => fetchUrls({ data: { paths: clean } }),
    enabled: clean.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  return (path: string | null | undefined) => (path ? query.data?.[path] : undefined);
}
