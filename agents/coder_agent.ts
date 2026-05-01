import { chat, ChatMessage } from "../core/llm_client.ts";
import { coderTools } from "../tools/registry.ts";
import { getSoul } from "../config/user_prefs.ts";

export async function executeCoderTask(sessionId: string, history: ChatMessage[]): Promise<string> {
  const soul = await getSoul();
  const systemPrompt = `${soul}\n\n[CONTEXTO ESPECIALIZADO: CODER AGENT]\nEres un especialista en desarrollo de software (TypeScript, Deno, Arquitectura). Utiliza las herramientas de terminal y archivos para ayudar al usuario de forma técnica y manipular su repositorio local.`;
  
  return await chat(sessionId, history, coderTools, systemPrompt);
}
