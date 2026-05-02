import { colors } from "@cliffy/ansi/colors";

async function install() {
  console.log(colors.bold.cyan("🚀 Instalando Codie CLI de forma global..."));

  const cmd = new Deno.Command("deno", {
    args: ["install", "--global", "--allow-all", "--config", "deno.json", "--name", "codie", "--force", "main.ts"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();
  const decoder = new TextDecoder();

  if (code === 0) {
    console.log(decoder.decode(stdout));
    console.log(colors.bold.green("\n✅ Instalación completada con éxito."));
    console.log(colors.yellow("💡 Reinicia tu terminal o abre una nueva pestaña y escribe 'codie' en cualquier directorio para empezar a usar tu orquestador IA."));
  } else {
    console.error(colors.bold.red("\n❌ Hubo un error durante la instalación:"));
    console.error(decoder.decode(stderr));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  install();
}
