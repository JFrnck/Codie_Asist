import { loadConfig } from "../config/user_prefs.ts";
import { dispatchTool } from "../tools/registry.ts";
import { addMessage } from "./memory.ts";
import { CodieSpinner } from "../utils/ui.ts";

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export async function chat(
  sessionId: string, 
  messages: ChatMessage[], 
  tools: any[], 
  agentSystemPrompt: string
): Promise<string> {
  const config = await loadConfig();

  const payloadMessages: ChatMessage[] = [
    { role: "system", content: agentSystemPrompt },
    ...messages
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    model: "gpt-4o-mini",
    messages: payloadMessages,
    temperature: 0.7
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = "auto";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error del LLM (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  const choice = data.choices[0];
  const responseMessage = choice.message as ChatMessage;
  
  // Guardar respuesta inicial del asistente (con content o tool_calls)
  addMessage(sessionId, responseMessage);

  if (choice.finish_reason === "tool_calls" && responseMessage.tool_calls) {
    for (const toolCall of responseMessage.tool_calls) {
      CodieSpinner.stop();
      
      let result: string;
      try {
        result = await dispatchTool(toolCall.function.name, toolCall.function.arguments);
      } catch (err) {
        result = `Error crítico de ejecución: ${err instanceof Error ? err.message : String(err)}`;
      }
      
      CodieSpinner.start("Re-analizando resultados...");
      
      const toolMsg: ChatMessage = {
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
        name: toolCall.function.name
      };
      
      addMessage(sessionId, toolMsg);
      payloadMessages.push(responseMessage);
      payloadMessages.push(toolMsg);
    }
    
    // Llamada recursiva con los mensajes actualizados sin duplicar el system
    const updatedMessages = payloadMessages.slice(1);
    return await chat(sessionId, updatedMessages, tools, agentSystemPrompt);
  }

  return responseMessage.content ?? "";
}
