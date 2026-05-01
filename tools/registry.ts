import { executeShell } from "./system/shell.ts";
import { leer_archivo, escribir_archivo } from "./system/fs.ts";
import { createNotionPage } from "./integrations/notion.ts";
import { readRecentEmails } from "./integrations/gmail.ts";

export const coderTools = [
  {
    type: "function",
    function: {
      name: "executeShell",
      description: "Ejecuta un comando de bash en el sistema del usuario. Utilízalo para listar archivos, crear scripts o cualquier operación en la terminal.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "El comando bash a ejecutar."
          }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "leer_archivo",
      description: "Lee silenciosamente el contenido de un archivo local. Utilízalo para entender el código fuente antes de modificarlo.",
      parameters: {
        type: "object",
        properties: {
          ruta: {
            type: "string",
            description: "Ruta relativa o absoluta al archivo a leer."
          }
        },
        required: ["ruta"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "escribir_archivo",
      description: "Crea o sobreescribe un archivo en el sistema local. El usuario deberá autorizar esta acción mediante un prompt.",
      parameters: {
        type: "object",
        properties: {
          ruta: {
            type: "string",
            description: "Ruta del archivo a crear o sobreescribir."
          },
          contenido: {
            type: "string",
            description: "El código fuente o contenido exacto a escribir."
          }
        },
        required: ["ruta", "contenido"]
      }
    }
  }
];

export const prodTools = [
  {
    type: "function",
    function: {
      name: "createNotionPage",
      description: "Crea una página o nota en Notion.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título de la página" },
          content: { type: "string", description: "Contenido principal" }
        },
        required: ["title", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "readRecentEmails",
      description: "Busca y lee correos recientes en Gmail.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Términos de búsqueda, ej. 'urgente' o vacío para todos" },
          maxResults: { type: "number", description: "Cantidad máxima de correos a leer" }
        },
        required: ["query", "maxResults"]
      }
    }
  }
];

export async function dispatchTool(name: string, argsStr: string): Promise<string> {
  let args;
  try {
    args = JSON.parse(argsStr);
  } catch (e) {
    return "Error: Los argumentos de la herramienta no son JSON válido.";
  }

  try {
    switch (name) {
      case "executeShell":
        return await executeShell(args.command);
      case "leer_archivo":
        return await leer_archivo(args.ruta);
      case "escribir_archivo":
        return await escribir_archivo(args.ruta, args.contenido);
      case "createNotionPage":
        return await createNotionPage(args.title, args.content);
      case "readRecentEmails":
        return await readRecentEmails(args.query, args.maxResults || 5);
      default:
        return `Error: La herramienta '${name}' no existe en el registro.`;
    }
  } catch (err) {
    return `Error inesperado ejecutando la herramienta ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
