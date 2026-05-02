import { ChatMessage } from "./llm_client.ts";
import { executeCoderTask } from "../agents/coder_agent.ts";
import { executeProdTask } from "../agents/prod_agent.ts";
import { getActiveProfile } from "../config/ai_profiles.ts";

export async function route(userInput: string, sessionId: string, history: ChatMessage[]): Promise<string> {
  const profile = await getActiveProfile();
  const apiKey = Deno.env.get(profile.apiKeyEnvVar) || "";
  
  const classificationPrompt = `Clasifica la siguiente petición del usuario. Responde ÚNICAMENTE con la palabra "PROD" si la petición involucra correos electrónicos, Gmail, Notion, productividad, bases de datos externas o gestión de tareas. Responde "CODER" si es cualquier otra cosa (código, archivos, terminal, sistema operativo, charla general).
Petición: "${userInput}"`;

  try {
    const endpoint = profile.protocol === "anthropic" ? profile.baseURL : `${profile.baseURL}/chat/completions`;
    
    let payload: any;
    const headers: any = { "Content-Type": "application/json" };
    
    if (profile.protocol === "anthropic") {
      payload = {
        model: profile.model,
        messages: [{ role: "user", content: classificationPrompt }],
        max_tokens: 5,
        temperature: 0
      };
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      payload = {
        model: profile.model,
        messages: [{ role: "user", content: classificationPrompt }],
        max_tokens: 5,
        temperature: 0
      };
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const intent = profile.protocol === "anthropic" 
        ? (data.content && data.content[0] ? data.content[0].text.trim().toUpperCase() : "")
        : data.choices[0].message.content.trim().toUpperCase();
      
      if (intent.includes("PROD")) {
        return await executeProdTask(sessionId, history);
      }
    }
  } catch (_error) {
    // Si falla la clasificación, asume Coder por defecto.
  }

  // Comportamiento predeterminado
  return await executeCoderTask(sessionId, history);
}
