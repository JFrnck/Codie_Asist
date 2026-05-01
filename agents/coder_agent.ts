import { chat, ChatMessage } from "../core/llm_client.ts";
import { coderTools } from "../tools/registry.ts";
import { getSoul } from "../config/user_prefs.ts";
import { selectPlaybook } from "../utils/playbooks.ts";

export async function executeCoderTask(sessionId: string, history: ChatMessage[]): Promise<string> {
  const soul = await getSoul();
  const playbook = await selectPlaybook("dev");
  
  let systemPrompt = `${soul}\n\n[CONTEXTO ESPECIALIZADO: CODER AGENT]\nEres un especialista en desarrollo de software (TypeScript, Deno, Arquitectura). Utiliza las herramientas de terminal y archivos para ayudar al usuario de forma técnica y manipular su repositorio local.\n\n[CONOCIMIENTO ACTUALIZADO: TAILWIND V4]\nRecuerda que Tailwind CSS v4 usa \`@import "tailwindcss";\` en el archivo CSS principal y NO requiere archivo \`tailwind.config.js\` ni integración manual con PostCSS en entornos modernos como Vite. Usa siempre las convenciones de v4.`;
  
  if (playbook) {
    systemPrompt += `\n\n[DIRECTIVA DE PLAYBOOK ACTIVA]\n${playbook}`;
  }
  
  return await chat(sessionId, history, coderTools, systemPrompt);
}
