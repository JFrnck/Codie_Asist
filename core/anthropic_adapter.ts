import { ChatMessage, ToolCall } from "./llm_client.ts";

export function buildAnthropicPayload(model: string, messages: ChatMessage[], tools: any[], systemPrompt: string) {
  const anthropicMessages: any[] = [];
  
  for (const msg of messages) {
    if (msg.role === "system") continue; // El rol system va en un campo separado en Anthropic
    
    if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
      anthropicMessages.push({
        role: "assistant",
        content: msg.tool_calls.map(tc => ({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments)
        }))
      });
      continue;
    }
    
    if (msg.role === "tool") {
      // Las respuestas de herramientas en Anthropic deben ir dentro de un mensaje del usuario
      anthropicMessages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: msg.tool_call_id,
          content: msg.content || ""
        }]
      });
      continue;
    }
    
    anthropicMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content || ""
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    model,
    system: systemPrompt,
    messages: anthropicMessages,
    max_tokens: 8192 // Requerimiento obligatorio de Anthropic
  };

  if (tools && tools.length > 0) {
    payload.tools = tools.map((t: any) => ({
      name: t.function.name,
      description: t.function.description || "",
      input_schema: t.function.parameters
    }));
  }

  return payload;
}

export function parseAnthropicResponse(data: any): ChatMessage {
  const contentBlocks = data.content || [];
  
  if (data.stop_reason === "tool_use") {
    const toolCalls: ToolCall[] = [];
    let textContent = "";
    
    for (const block of contentBlocks) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          }
        });
      }
    }
    
    return {
      role: "assistant",
      content: textContent || null,
      tool_calls: toolCalls
    };
  }
  
  const textContent = contentBlocks.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return {
    role: "assistant",
    content: textContent
  };
}
