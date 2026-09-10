import { supabase } from "@/integrations/supabase/client";
import type {
  BotConfig,
  BotEvent,
  BotFormData,
  BotRunner,
  BotRuntime,
} from "@/types/bots";

// As tabelas dos bots ainda não fazem parte do arquivo de tipos legado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function listBotRuntimes(): Promise<BotRuntime[]> {
  const { data, error } = await db.rpc("prospecta_list_bot_runtimes");
  if (error) throw error;
  return (data ?? []).map(
    (row: { runtime: BotRuntime }) => row.runtime,
  );
}

export async function listBotEvents(
  botId: string,
  limit = 30,
): Promise<BotEvent[]> {
  const { data, error } = await db.rpc("prospecta_get_bot_events", {
    p_bot_id: botId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as BotEvent[];
}

export async function listRecentBotEvents(limit = 20): Promise<BotEvent[]> {
  const { data, error } = await db.rpc("prospecta_get_recent_bot_events", {
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as BotEvent[];
}

export async function listOnlineRunners(): Promise<BotRunner[]> {
  const { data, error } = await db.rpc("prospecta_list_runners");
  if (error) throw error;
  return (data ?? []) as BotRunner[];
}

export async function requestBotCommand(
  botId: string,
  command: "rodando" | "pausado" | "parado",
  targetRunnerId?: string | null,
): Promise<void> {
  const { error } = await db.rpc("prospecta_request_command", {
    p_bot_id: botId,
    p_command: command,
    p_target_runner_id: targetRunnerId || null,
  });
  if (error) throw error;
}

export async function saveBotConfig(
  form: BotFormData,
  current?: BotConfig,
): Promise<void> {
  const payload = {
    ...form,
    slug: form.slug || slugify(form.name),
  };
  if (!current) {
    const { error } = await db.from("prospecta_bot_configs").insert(payload);
    if (error) throw error;
    return;
  }

  const { data, error } = await db
    .from("prospecta_bot_configs")
    .update(payload)
    .eq("id", current.id)
    .eq("version", current.version)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "O bot foi alterado por outro usuário. Atualize a página e tente novamente.",
    );
  }
}

export async function deleteBotConfig(config: BotConfig): Promise<void> {
  const { data, error } = await db
    .from("prospecta_bot_configs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", config.id)
    .eq("version", config.version)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("O bot já foi alterado ou removido.");
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
