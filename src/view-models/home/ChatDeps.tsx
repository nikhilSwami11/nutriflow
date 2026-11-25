"use client";
import { createContext, useContext } from "react";
import type { ChatBrain, ChatTool } from "@/domain/assistant";

export interface ChatDeps {
  /** The model. Absent without Supabase: the chat uses the rule router. */
  brain?: ChatBrain;
  tools: ChatTool[];
}

const Ctx = createContext<ChatDeps>({ tools: [] });
export const ChatDepsProvider = Ctx.Provider;
export const useChatDeps = () => useContext(Ctx);
