import { askPermission } from "../../utils/security_hitl.ts";

export async function run_background_command(command: string, args: string[], cwd?: string): Promise<string> {
  const displayCommand = `${command} ${args.join(" ")}`;
  const finalCommand = await askPermission(`(BACKGROUND) ${displayCommand}`);
  
  if (!finalCommand) {
    return "El usuario ha denegado la ejecución de este comando. Pregúntale qué desea hacer ahora o propón un comando alternativo.";
  }

  // Remove the (BACKGROUND) prefix if the user hasn't modified it
  const cmdToRun = finalCommand.startsWith("(BACKGROUND) ") ? finalCommand.replace("(BACKGROUND) ", "") : finalCommand;

  try {
    const cmd = new Deno.Command("bash", {
      args: ["-c", cmdToRun],
      cwd: cwd || Deno.cwd(),
      stdout: "null",
      stderr: "null",
      stdin: "null",
    });
    
    const child = cmd.spawn();
    child.unref(); // Desvincular el proceso hijo para no bloquear a Codie
    
    return `Proceso iniciado en segundo plano. PID: ${child.pid}. Guarda este PID por si necesitas detenerlo luego.`;
  } catch (error) {
    return `Error al iniciar el proceso en segundo plano: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function kill_background_process(pid: number): Promise<string> {
  const displayCommand = `kill -15 ${pid}`;
  const finalCommand = await askPermission(`(BACKGROUND KILL) ${displayCommand}`);
  
  if (!finalCommand) {
    return "El usuario ha denegado la detención de este proceso. Pregúntale qué desea hacer ahora.";
  }

  try {
    Deno.kill(pid, "SIGTERM");
    return `El proceso con PID ${pid} ha sido terminado exitosamente.`;
  } catch (error) {
    return `Error al terminar el proceso con PID ${pid}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
