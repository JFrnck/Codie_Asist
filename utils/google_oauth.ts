import { loadConfig, saveConfig } from "../config/user_prefs.ts";
import { colors } from "@cliffy/ansi/colors";

const REDIRECT_URI = "http://localhost:8080/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export async function getValidAccessToken(): Promise<string> {
  const config = await loadConfig();

  if (!config.gmailClientId || !config.gmailClientSecret) {
    throw new Error("Client ID o Client Secret no configurados.");
  }

  // 1. Si ya tenemos un refresh token, lo usamos para conseguir un access_token fresco silenciosamente
  if (config.gmailRefreshToken) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.gmailClientId,
          client_secret: config.gmailClientSecret,
          refresh_token: config.gmailRefreshToken,
          grant_type: "refresh_token"
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (e) {
      console.error(colors.red("Fallo al refrescar token. Reiniciando flujo OAuth interactivo..."), e);
    }
  }

  // 2. Si no hay refresh token, iniciamos el flujo interactivo
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.gmailClientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent`;

  console.log(colors.bold.yellow("\n⚠️  Autenticación Requerida para Gmail"));
  console.log(colors.cyan("Abriendo navegador para iniciar sesión en Google..."));
  console.log(colors.gray(`Si no se abre automáticamente, haz clic aquí:\n${authUrl}\n`));

  // Intentar abrir el navegador nativamente
  try {
    const os = Deno.build.os;
    const cmd = os === "windows" ? ["start", authUrl] : os === "darwin" ? ["open", authUrl] : ["xdg-open", authUrl];
    new Deno.Command(cmd[0], { args: cmd.slice(1) }).spawn();
  } catch (_e) {
    // ignorar fallo de auto-apertura
  }

  // Levantar servidor efímero para atrapar el código
  return new Promise((resolve, reject) => {
    const ac = new AbortController();
    
    Deno.serve({ port: 8080, signal: ac.signal, onListen: () => {} }, async (req) => {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");

      if (code) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: config.gmailClientId!,
              client_secret: config.gmailClientSecret!,
              code: code,
              grant_type: "authorization_code",
              redirect_uri: REDIRECT_URI
            })
          });

          const data = await response.json();
          
          if (data.access_token) {
            // Persistir refresh token en la bóveda
            if (data.refresh_token) {
              await saveConfig({ ...config, gmailRefreshToken: data.refresh_token });
            }
            
            resolve(data.access_token);
            setTimeout(() => ac.abort(), 500);
            return new Response("Autenticacion completada exitosamente. Puedes cerrar esta pestana y volver a tu terminal.", { status: 200 });
          } else {
            reject(new Error("Google no retornó un access_token."));
            setTimeout(() => ac.abort(), 500);
            return new Response("Error obteniendo el token de acceso.", { status: 500 });
          }
        } catch (error) {
          reject(error);
          setTimeout(() => ac.abort(), 500);
          return new Response("Fallo en la peticion al servidor de Google.", { status: 500 });
        }
      }

      return new Response("Esperando codigo OAuth... por favor completa el inicio de sesion.", { status: 200 });
    });
  });
}
