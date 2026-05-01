export async function read_documentation(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    
    if (!response.ok) {
      return `Error al leer la URL (${response.status}): ${await response.text()}`;
    }
    
    const text = await response.text();
    return `[CONTENIDO DE LA URL: ${url}]\n\n${text}`;
  } catch (error) {
    return `Error de conexión al leer la URL: ${error instanceof Error ? error.message : String(error)}`;
  }
}
