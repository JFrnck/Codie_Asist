import { join } from "@std/path";
import { getConfigDir } from "../config/user_prefs.ts";

const KV_LIMIT = 60000; // 60KB per chunk to be safely under the 64KiB Deno KV limit

export async function getKvPath() {
  const configDir = getConfigDir();
  return join(configDir, "knowledge_vault.db");
}

export async function saveDoc(tech_name: string, content: string): Promise<void> {
  const kv = await Deno.openKv(await getKvPath());
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const chunksCount = Math.ceil(data.length / KV_LIMIT);
    
    // Guardar metadata
    await kv.set(["docs_meta", tech_name.toLowerCase()], { chunksCount });
    
    // Guardar chunks
    for (let i = 0; i < chunksCount; i++) {
      const chunk = data.slice(i * KV_LIMIT, (i + 1) * KV_LIMIT);
      await kv.set(["docs", tech_name.toLowerCase(), i], chunk);
    }
  } finally {
    // Es crítico cerrar la conexión KV en scripts One-Shot para evitar memory leaks
    kv.close();
  }
}

export async function getDoc(tech_name: string): Promise<string | null> {
  const kv = await Deno.openKv(await getKvPath());
  try {
    const metaRecord = await kv.get<{ chunksCount: number }>(["docs_meta", tech_name.toLowerCase()]);
    if (!metaRecord.value) return null;
    
    const chunksCount = metaRecord.value.chunksCount;
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    
    for (let i = 0; i < chunksCount; i++) {
      const chunkRecord = await kv.get<Uint8Array>(["docs", tech_name.toLowerCase(), i]);
      if (chunkRecord.value) {
        chunks.push(chunkRecord.value);
        totalLength += chunkRecord.value.length;
      }
    }
    
    const mergedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedData.set(chunk, offset);
      offset += chunk.length;
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(mergedData);
  } finally {
    kv.close();
  }
}

export async function listDocs(): Promise<string[]> {
  const kv = await Deno.openKv(await getKvPath());
  try {
    const iter = kv.list({ prefix: ["docs_meta"] });
    const docs: string[] = [];
    for await (const res of iter) {
      const tech_name = res.key[1] as string;
      docs.push(tech_name);
    }
    return docs;
  } finally {
    kv.close();
  }
}
