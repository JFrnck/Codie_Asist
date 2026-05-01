import { ChatMessage } from "./llm_client.ts";
import { executeCoderTask } from "../agents/coder_agent.ts";
import { executeProdTask } from "../agents/prod_agent.ts";
import { loadConfig } from "../config/user_prefs.ts";

export async function route(userInput: string, sessionId: string, history: ChatMessage[]): Promise<string> {
  const config = await loadConfig();
  
  const classificationPrompt = `Clasifica la siguiente petición del usuario. Responde ÚNICAMENTE con la palabra "PROD" si la petición involucra correos electrónicos, Gmail, Notion, productividad, bases de datos externas o gestión de tareas. Responde "CODER" si es cualquier otra cosa (código, archivos, terminal, sistema operativo, charla general).
Petición: "${userInput}"`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: classificationPrompt }],
        max_tokens: 5,
        temperature: 0
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const intent = data.choices[0].message.content.trim().toUpperCase();
      
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
