import { saveDoc, getDoc } from "../../core/knowledge_base.ts";

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

export async function get_tech_docs(tech_name: string): Promise<string> {
  try {
    const doc = await getDoc(tech_name);
    if (doc) {
      return `[MEMORIA LOCAL: Documentación de ${tech_name}]\n\n${doc}`;
    } else {
      return `La tecnología '${tech_name}' no se encuentra en la Memoria a Largo Plazo. Utiliza la herramienta 'web_search_and_learn' para buscarla en internet y aprenderla.`;
    }
  } catch (error) {
    return `Error al acceder a la base de conocimiento: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function web_search_and_learn(tech_name: string, url: string): Promise<string> {
  try {
    // Reutilizar lógica de Jina AI
    const content = await read_documentation(url);
    
    // Si la lectura falló, read_documentation devuelve un string de Error
    if (content.startsWith("Error")) {
      return content;
    }

    // Guardar en Memoria a Largo Plazo
    await saveDoc(tech_name, content);
    
    return `¡Éxito! He leído la documentación desde ${url} y la he memorizado permanentemente bajo el nombre '${tech_name}'.\n\nAquí tienes el contenido que aprendí:\n\n${content}`;
  } catch (error) {
    return `Error al intentar aprender la tecnología: ${error instanceof Error ? error.message : String(error)}`;
  }
}
