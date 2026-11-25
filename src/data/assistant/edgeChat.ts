import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatBrain } from "@/domain/assistant";

/** The model answers in the edge function `chat` (the OpenAI key lives there). Tools run here, as the signed-in person. */
export class EdgeChatBrain implements ChatBrain {
  constructor(private db: SupabaseClient) {}
  async next(input: Parameters<ChatBrain["next"]>[0]) {
    const { data, error } = await this.db.functions.invoke("chat", { body: input });
    if (error) throw error;
    return data as Awaited<ReturnType<ChatBrain["next"]>>;
  }
}
