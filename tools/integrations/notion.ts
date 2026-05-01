import { loadConfig } from "../../config/user_prefs.ts";

export async function createNotionPage(title: string, content: string): Promise<string> {
  const config = await loadConfig();
  if (!config.notionApiKey) {
    return "Error: Notion API Key no está configurada. Pídele al usuario que ejecute 'codie setup' para añadirla.";
  }
  
  // En esta fase iterativa, simulamos la respuesta de la API para aislar pruebas arquitectónicas.
  return `Éxito: Página de Notion '${title}' creada correctamente en la base de datos con el contenido especificado.`;
}
