import { Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { getConfigDir } from "../config/user_prefs.ts";
import { CodieSpinner } from "./ui.ts";

export async function selectPlaybook(domain: "dev" | "prod"): Promise<string | null> {
  CodieSpinner.stop();
  
  const dirPath = `${getConfigDir()}/playbooks/${domain}`;
  const files: string[] = [];
  
  try {
    for await (const dirEntry of Deno.readDir(dirPath)) {
      if (dirEntry.isFile && dirEntry.name.endsWith(".md")) {
        files.push(dirEntry.name);
      }
    }
  } catch (_e) {
    // Si no existe el directorio, lo ignoramos
  }

  if (files.length === 0) {
    CodieSpinner.start("Pensando...");
    return null;
  }

  console.log(""); // Line break for UI
  const selected = await Select.prompt({
    message: "¿Deseas inyectar alguna directiva (Playbook) para esta tarea?",
    options: ["Ninguna", ...files],
  });

  if (selected === "Ninguna") {
    CodieSpinner.start("Reanudando ejecución...");
    return null;
  }

  CodieSpinner.start(`Inyectando Playbook: ${selected}...`);
  try {
    return await Deno.readTextFile(`${dirPath}/${selected}`);
  } catch (err) {
    console.error(colors.red(`Error leyendo playbook ${selected}: ${err}`));
    return null;
  }
}
