import { chat, ChatMessage } from "../core/llm_client.ts";
import { prodTools } from "../tools/registry.ts";
import { getSoul } from "../config/user_prefs.ts";
import { selectPlaybook } from "../utils/playbooks.ts";

export async function executeProdTask(sessionId: string, history: ChatMessage[]): Promise<string> {
  const soul = await getSoul();
  const playbook = await selectPlaybook("prod");
  
  let systemPrompt = `${soul}\n\n[CONTEXTO ESPECIALIZADO: PROD AGENT]\nEres un asistente ejecutivo y Product Manager experto en productividad y organización. Tu trabajo es gestionar correos y organizar notas o tareas en Notion para liberar de carga al usuario.`;
  
  if (playbook) {
    systemPrompt += `\n\n[DIRECTIVA DE PLAYBOOK ACTIVA]\n${playbook}`;
  }
  
  return await chat(sessionId, history, prodTools, systemPrompt);
}
