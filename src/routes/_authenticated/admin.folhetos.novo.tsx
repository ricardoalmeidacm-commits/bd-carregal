import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/AdminShell";
import { FlyerForm } from "@/components/FlyerForm";

export const Route = createFileRoute("/_authenticated/admin/folhetos/novo")({
  component: NovoFolheto,
});

function NovoFolheto() {
  return (
    <AdminShell titulo="Novo folheto" subtitulo="Publicação digital do museu">
      <FlyerForm />
    </AdminShell>
  );
}
