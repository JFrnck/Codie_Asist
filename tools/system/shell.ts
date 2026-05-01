import { askPermission } from "../../utils/security_hitl.ts";

export async function executeShell(command: string): Promise<string> {
  const finalCommand = await askPermission(command);
  
  if (!finalCommand) {
    return "El usuario ha denegado la ejecución de este comando. Pregúntale qué desea hacer ahora o propón un comando alternativo.";
  }

  try {
    const cmd = new Deno.Command("bash", {
      args: ["-c", finalCommand],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await cmd.output();
    const decoder = new TextDecoder();
    
    let output = decoder.decode(stdout);
    const errorOutput = decoder.decode(stderr);
    
    if (errorOutput) {
      output += `\n[STDERR]:\n${errorOutput}`;
    }
    
    return output.trim() || `Comando ejecutado con código de salida ${code} (sin output).`;
  } catch (error) {
    return `Error crítico al ejecutar el comando: ${error instanceof Error ? error.message : String(error)}`;
  }
}
