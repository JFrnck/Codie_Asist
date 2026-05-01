import { askFileWritePermission } from "../../utils/security_hitl.ts";

export async function leer_archivo(ruta: string): Promise<string> {
  try {
    const contenido = await Deno.readTextFile(ruta);
    return contenido;
  } catch (error) {
    return `Error al leer el archivo en ${ruta}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function escribir_archivo(ruta: string, contenido: string): Promise<string> {
  const permit = await askFileWritePermission(ruta, contenido);
  
  if (!permit) {
    return "El usuario ha denegado la ejecución de este comando. Pregúntale qué desea hacer ahora o propón un comando alternativo.";
  }

  try {
    await Deno.writeTextFile(ruta, contenido);
    return `Archivo ${ruta} escrito exitosamente.`;
  } catch (error) {
    return `Error al escribir el archivo en ${ruta}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
