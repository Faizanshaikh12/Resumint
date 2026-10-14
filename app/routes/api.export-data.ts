import type { Route } from "./+types/api.export-data";
import { requireUser } from "~/auth/helpers.server";
import { getDatabase } from "~/db/helpers.server";
import { exportAllUserData } from "~/db/queries/users";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = (context as { cloudflare?: { env?: Env } })?.cloudflare?.env;
  const user = await requireUser(request, env);
  const db = await getDatabase(env);

  const exportData = await exportAllUserData(db, user.id, user.email);
  const jsonString = JSON.stringify(exportData, null, 2);

  const filename = `resumint-data-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
