import { Database } from "@db/sqlite";
import { join } from "@std/path";
import { getConfigDir } from "../config/user_prefs.ts";
import { ChatMessage } from "./llm_client.ts";

let db: Database | null = null;

export function initDB(): void {
  const dbPath = join(getConfigDir(), "memory.db");
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      tool_calls TEXT,
      tool_call_id TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function addMessage(session_id: string, msg: ChatMessage): void {
  if (!db) initDB();
  db!.prepare(`
    INSERT INTO messages (session_id, role, content, tool_calls, tool_call_id, name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    session_id,
    msg.role,
    msg.content ?? null,
    msg.tool_calls ? JSON.stringify(msg.tool_calls) : null,
    msg.tool_call_id ?? null,
    msg.name ?? null
  );
}

export function getHistory(session_id: string): ChatMessage[] {
  if (!db) initDB();
  const rows = db!.prepare(`SELECT id, role, content, tool_calls, tool_call_id, name FROM messages WHERE session_id = ? ORDER BY id ASC`).all(session_id) as Array<Record<string, unknown>>;
  
  const messages: ChatMessage[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const msg: ChatMessage = { role: row.role as any, content: row.content as string | null };
    if (row.tool_calls) msg.tool_calls = JSON.parse(row.tool_calls as string);
    if (row.tool_call_id) msg.tool_call_id = row.tool_call_id as string;
    if (row.name) msg.name = row.name as string;
    messages.push(msg);
  }
  
  // Auto-Sanitización (Crash Recovery)
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.tool_calls) {
      const lastRow = rows[rows.length - 1];
      db!.prepare(`DELETE FROM messages WHERE id = ?`).run(lastRow.id as number);
      messages.pop();
    }
  }

  return messages;
}

export function clearSession(session_id: string): void {
  if (!db) initDB();
  db!.prepare(`DELETE FROM messages WHERE session_id = ?`).run(session_id);
}
