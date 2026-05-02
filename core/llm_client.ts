import { getActiveProfile } from "../config/ai_profiles.ts";
import { loadConfig } from "../config/user_prefs.ts";
import { dispatchTool } from "../tools/registry.ts";
import { addMessage } from "./memory.ts";
import { CodieSpinner } from "../utils/ui.ts";
import { buildAnthropicPayload, parseAnthropicResponse } from "./anthropic_adapter.ts";

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
  const profile = await getActiveProfile();
  const apiKey = Deno.env.get(profile.apiKeyEnvVar) || "";

  let payload: any;
  const headers: any = { "Content-Type": "application/json" };
  const endpoint = profile.protocol === "anthropic" ? profile.baseURL : `${profile.baseURL}/chat/completions`;

  const payloadMessages: ChatMessage[] = [
    { role: "system", content: agentSystemPrompt },
    ...messages
  ];

  if (profile.protocol === "anthropic") {
    payload = buildAnthropicPayload(profile.model, messages, tools, agentSystemPrompt);
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    payload = {
      model: profile.model,
      messages: payloadMessages,
      temperature: 0.7
    };
    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = "auto";
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error del LLM (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  let responseMessage: ChatMessage;

  if (profile.protocol === "anthropic") {
    responseMessage = parseAnthropicResponse(data);
  } else {
    const choice = data.choices[0];
    responseMessage = choice.message as ChatMessage;
  }
  
  // Guardar respuesta inicial del asistente (con content o tool_calls)
  addMessage(sessionId, responseMessage);

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    payloadMessages.push(responseMessage);

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
      payloadMessages.push(toolMsg);
    }
    
    // Llamada recursiva con los mensajes actualizados sin duplicar el system
    const updatedMessages = payloadMessages.slice(1);
    return await chat(sessionId, updatedMessages, tools, agentSystemPrompt);
  }

  return responseMessage.content ?? "";
}
