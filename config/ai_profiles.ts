import { join } from "@std/path";
import { exists } from "@std/fs";
import { getConfigDir } from "./user_prefs.ts";

export interface AIProfile {
  baseURL: string;
  model: string;
  apiKeyEnvVar: string;
  protocol?: "openai" | "anthropic";
}

export const defaultProfiles: Record<string, AIProfile> = {
  openai: { 
    baseURL: "https://api.openai.com/v1", 
    model: "gpt-5.4-mini", 
    apiKeyEnvVar: "OPENAI_API_KEY",
    protocol: "openai"
  },
  openrouter: { 
    baseURL: "https://openrouter.ai/api/v1", 
    model: "anthropic/claude-3.7-sonnet", 
    apiKeyEnvVar: "OPENROUTER_API_KEY",
    protocol: "openai"
  },
  gemini: { 
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", 
    model: "gemini-1.5-pro", 
    apiKeyEnvVar: "GEMINI_API_KEY",
    protocol: "openai"
  },
  claude: { 
    baseURL: "https://api.anthropic.com/v1/messages", 
    model: "claude-haiku-4-5-20251001", 
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    protocol: "anthropic"
  },
  ollama: { 
    baseURL: "http://localhost:11434/v1", 
    model: "qwen2.5-coder", 
    apiKeyEnvVar: "OLLAMA_API_KEY" 
  }
};

let activeProfileName = "openai";
let loadedProfiles: Record<string, AIProfile> | null = null;

export async function getProfiles(): Promise<Record<string, AIProfile>> {
  if (loadedProfiles) return loadedProfiles;

  const profilesPath = join(getConfigDir(), "profiles.json");
  if (await exists(profilesPath)) {
    try {
      const data = await Deno.readTextFile(profilesPath);
      const parsedProfiles = JSON.parse(data) as Record<string, AIProfile>;
      
      let hasUpdates = false;
      for (const [key, profile] of Object.entries(defaultProfiles)) {
        if (!parsedProfiles[key]) {
          parsedProfiles[key] = profile;
          hasUpdates = true;
        }
      }
      
      loadedProfiles = parsedProfiles;
      
      if (hasUpdates) {
        try {
          await Deno.writeTextFile(profilesPath, JSON.stringify(loadedProfiles, null, 2));
        } catch (err) {
          console.error("No se pudo actualizar profiles.json con nuevos perfiles:", err);
        }
      }
      
      return loadedProfiles;
    } catch (err) {
      console.error("Error al leer profiles.json, usando valores por defecto:", err);
    }
  }

  // Create default if it doesn't exist
  loadedProfiles = { ...defaultProfiles };
  try {
    await Deno.writeTextFile(profilesPath, JSON.stringify(loadedProfiles, null, 2));
  } catch (err) {
    console.error("No se pudo escribir profiles.json:", err);
  }

  return loadedProfiles;
}

export async function setActiveProfile(name: string): Promise<void> {
  const profileKey = name.toLowerCase();
  const profiles = await getProfiles();
  if (profiles[profileKey]) {
    activeProfileName = profileKey;
  } else {
    throw new Error(`Perfil de IA '${name}' no existe. Perfiles disponibles: ${Object.keys(profiles).join(", ")}`);
  }
}

export async function getActiveProfile(): Promise<AIProfile> {
  const profiles = await getProfiles();
  return profiles[activeProfileName];
}
