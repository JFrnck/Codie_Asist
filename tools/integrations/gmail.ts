import { loadConfig } from "../../config/user_prefs.ts";
import { getValidAccessToken } from "../../utils/google_oauth.ts";

export async function readRecentEmails(query: string, maxResults: number): Promise<string> {
  const config = await loadConfig();
  if (!config.gmailClientId || !config.gmailClientSecret) {
    return "Error: Las credenciales OAuth de Gmail no están configuradas. Pídele al usuario que ejecute 'codie setup' para añadir Client ID y Client Secret.";
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (error) {
    return `Error obteniendo Token de Google OAuth: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    // 1. Obtener lista de mensajes (ID's)
    const qParam = query ? `&q=${encodeURIComponent(query)}` : "";
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!listRes.ok) {
      throw new Error(`Fallo al listar correos (${listRes.status}): ${await listRes.text()}`);
    }
    
    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return "La bandeja de entrada está vacía o no se encontraron correos para esta búsqueda.";
    }

    // 2. Fetch de detalles de mensajes en paralelo (para maximizar velocidad)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgPromises = listData.messages.map((msg: any) => 
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      }).then(r => r.json())
    );
    
    const messages = await Promise.all(msgPromises);

    // 3. Formatear y construir la cadena de texto semántica
    let resultText = `Resultados de correos (Query: ${query || "Todos"}):\n\n`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages.forEach((msg: any, i: number) => {
      const headers = msg.payload?.headers || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "Sin Asunto";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const from = headers.find((h: any) => h.name === "From")?.value || "Desconocido";
      const snippet = msg.snippet || "Sin vista previa";
      
      resultText += `${i + 1}. De: ${from}\n   Asunto: ${subject}\n   Resumen: ${snippet}\n\n`;
    });

    return resultText.trim();
  } catch (error) {
    return `Error crítico consumiendo la API de Gmail: ${error instanceof Error ? error.message : String(error)}`;
  }
}
