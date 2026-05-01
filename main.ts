import { Command } from "@cliffy/command";
import { Secret, Input } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { hasConfig, saveConfig, initializeSoul, loadConfig, initializePlaybooks } from "./config/user_prefs.ts";
import { CodieSpinner } from "./utils/ui.ts";
import { ChatMessage } from "./core/llm_client.ts";
import { initDB, addMessage, getHistory, clearSession } from "./core/memory.ts";
import { route } from "./core/router.ts";

if (import.meta.main) {
  const args = Deno.args;
  const isSetupOrHelp = args.includes("setup") || args.includes("help") || args.includes("-h") || args.includes("--help");
  
  if (!isSetupOrHelp) {
    const configExists = await hasConfig();
    if (!configExists) {
      console.error(colors.red("Error: Codie no está configurado."));
      console.log(colors.yellow("Por favor, ejecuta 'codie setup' primero para configurar tu API Key."));
      Deno.exit(1);
    }
  }

  try {
    await new Command()
      .name("codie")
      .version("1.1.0")
      .description("Tu agente de IA local para ingeniería de software.")
      .action(async () => {
         await initializeSoul();
         await initializePlaybooks();
         initDB();
         const sessionId = "default";
         
         console.log(colors.bold.green("Codie inicializado. Escribe 'exit', 'quit' o 'clear' para limpiar el historial.\n"));

         while (true) {
           const userInput = await Input.prompt({
             message: colors.bold.cyan("Tú:"),
           });

           const text = userInput.trim();
           if (!text) continue;
           
           if (text.toLowerCase() === "exit" || text.toLowerCase() === "quit") {
             console.log(colors.gray("Hasta luego."));
             break;
           }
           
           if (text.toLowerCase() === "clear") {
             clearSession(sessionId);
             console.log(colors.yellow("Historial de la sesión borrado."));
             continue;
           }

           const userMsg: ChatMessage = { role: "user", content: text };
           addMessage(sessionId, userMsg);
           
           CodieSpinner.start("Pensando...");
           
           try {
             const history = getHistory(sessionId);
             const response = await route(text, sessionId, history);
             
             CodieSpinner.stop();
             console.log(`\n${colors.bold.green("Codie:")} ${response}\n`);
           } catch (err) {
             CodieSpinner.stop();
             console.error(colors.red(`\nError: ${err instanceof Error ? err.message : String(err)}\n`));
           }
         }
      })
      .command("setup", "Configura las preferencias iniciales y tus API Keys.")
      .action(async () => {
        console.log(colors.bold.blue("=== Configuración de Codie ==="));
        
        let existingConfig: any = null;
        if (await hasConfig()) {
          try {
            existingConfig = await loadConfig();
          } catch (e) {
            // Ignorar error de carga para continuar con el setup limpio si está corrupto
          }
        }

        const openaiMsg = existingConfig?.apiKey 
          ? `Ingresa tu API Key de OpenAI (Enter para mantener la actual: ${existingConfig.apiKey.slice(0, 7)}***):`
          : "Ingresa tu API Key de OpenAI (Obligatorio):";

        const apiKeyInput = await Secret.prompt({
          message: openaiMsg,
          validate: (val) => {
            if (val.length > 0) return true;
            if (existingConfig?.apiKey) return true;
            return "La API Key principal no puede estar vacía.";
          },
        });
        const finalApiKey = apiKeyInput || existingConfig?.apiKey;

        const notionMsg = existingConfig?.notionApiKey
          ? `Ingresa tu API Key de Notion (Enter para mantener la actual: ${existingConfig.notionApiKey.slice(0, 7)}***):`
          : "Ingresa tu API Key de Notion (Opcional, Enter para saltar):";

        const notionApiKeyInput = await Input.prompt({
          message: notionMsg,
        });
        const finalNotionApiKey = notionApiKeyInput || existingConfig?.notionApiKey;

        const gmailIdMsg = existingConfig?.gmailClientId
          ? `Ingresa tu Google Client ID (Enter para mantener el actual: ${existingConfig.gmailClientId.slice(0, 7)}***):`
          : "Ingresa tu Google Client ID de OAuth (Opcional, Enter para saltar):";

        const gmailClientIdInput = await Input.prompt({
          message: gmailIdMsg,
        });
        const finalGmailClientId = gmailClientIdInput || existingConfig?.gmailClientId;

        const gmailSecretMsg = existingConfig?.gmailClientSecret
          ? `Ingresa tu Google Client Secret (Enter para mantener el actual: ${existingConfig.gmailClientSecret.slice(0, 7)}***):`
          : "Ingresa tu Google Client Secret de OAuth (Opcional, Enter para saltar):";

        const gmailClientSecretInput = await Input.prompt({
          message: gmailSecretMsg,
        });
        const finalGmailClientSecret = gmailClientSecretInput || existingConfig?.gmailClientSecret;

        try {
          await saveConfig({ 
            apiKey: finalApiKey, 
            notionApiKey: finalNotionApiKey || undefined, 
            gmailClientId: finalGmailClientId || undefined,
            gmailClientSecret: finalGmailClientSecret || undefined
          });
          console.log(colors.green("\n¡Configuración guardada exitosamente en ~/.codie/config.json!"));
        } catch (error) {
          console.error(colors.red("\nHubo un problema al guardar la configuración."));
          Deno.exit(1);
        }
      })
      .parse(Deno.args);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Interrupted")) {
        console.log(colors.gray("\nSesión finalizada por el usuario."));
        Deno.exit(0);
    }
    console.error(colors.red(`Error fatal: ${error instanceof Error ? error.message : String(error)}`));
    Deno.exit(1);
  }
}
