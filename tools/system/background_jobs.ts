export async function run_background_command(command: string, args: string[], cwd?: string): Promise<string> {
  const cmdToRun = command.startsWith("(BACKGROUND) ") ? command.replace("(BACKGROUND) ", "") : command;

  try {
    const cmd = new Deno.Command("bash", {
      args: ["-c", `${cmdToRun} ${args.join(" ")}`],
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
  try {
    Deno.kill(pid, "SIGTERM");
    return `El proceso con PID ${pid} ha sido terminado exitosamente.`;
  } catch (error) {
    return `Error al terminar el proceso con PID ${pid}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
