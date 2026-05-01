import { join } from "@std/path";
import { exists, ensureDir } from "@std/fs";

export interface CodieConfig {
  apiKey: string;
  notionApiKey?: string;
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
}

export function getConfigDir(): string {
  const homeEnv = Deno.build.os === "windows" ? "USERPROFILE" : "HOME";
  const home = Deno.env.get(homeEnv);
  
  if (!home) {
    throw new Error("No se pudo determinar el directorio HOME del usuario.");
  }
  
  return join(home, ".codie");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export function getSoulPath(): string {
  return join(getConfigDir(), "soul.md");
}

export async function initializeSoul(): Promise<void> {
  const soulPath = getSoulPath();
  const defaultSoul = `# System Prompt de Codie
Eres Codie, un ingeniero de software de nivel experto que asiste al usuario.
- Debes responder siempre de forma concisa y técnica.
- Estás autorizado a usar herramientas del sistema cuando se te solicite, pero explica brevemente qué comando ejecutarás o por qué.
`;
  if (!(await exists(soulPath))) {
    const configDir = getConfigDir();
    await ensureDir(configDir);
    await Deno.writeTextFile(soulPath, defaultSoul);
  }
}

export async function getSoul(): Promise<string> {
  const soulPath = getSoulPath();
  if (!(await exists(soulPath))) {
    await initializeSoul();
  }
  return await Deno.readTextFile(soulPath);
}

export async function saveConfig(config: CodieConfig): Promise<void> {
  try {
    const configDir = getConfigDir();
    await ensureDir(configDir);
    
    const configPath = getConfigPath();
    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    throw error;
  }
}

export async function loadConfig(): Promise<CodieConfig> {
  try {
    const configPath = getConfigPath();
    const data = await Deno.readTextFile(configPath);
    return JSON.parse(data) as CodieConfig;
  } catch (error) {
    console.error("Error al leer la configuración:", error);
    throw error;
  }
}

export async function hasConfig(): Promise<boolean> {
  const configPath = getConfigPath();
  return await exists(configPath);
}
