import { Select, Input } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";

export async function askPermission(command: string): Promise<string | null> {
  console.log(`\n${colors.bold.red("⚠️  Codie intentará ejecutar el siguiente comando:")}`);
  console.log(colors.bgBlack.white(` $ ${command} `));
  console.log(""); // Line break

  const action = await Select.prompt({
    message: "¿Deseas permitir esta acción?",
    options: [
      { name: "✅ Sí, ejecutar", value: "Y" },
      { name: "❌ No, abortar", value: "n" },
      { name: "✏️  Modificar comando", value: "Modificar" },
    ],
  });

  if (action === "Y") {
    return command;
  } else if (action === "Modificar") {
    const newCommand = await Input.prompt({
      message: "Modifica el comando:",
      default: command,
    });
    return newCommand;
  }
  
  return null;
}

export async function askFileWritePermission(filePath: string, contentPreview: string): Promise<boolean> {
  console.log(`\n${colors.bold.red("⚠️  Codie intentará crear/modificar el siguiente archivo:")}`);
  console.log(colors.bgBlack.white(` 📄 ${filePath} `));
  console.log(colors.gray("Preview del contenido:\n" + contentPreview.slice(0, 150) + (contentPreview.length > 150 ? "...\n[Continúa]" : "")));
  console.log(""); // Line break

  const action = await Select.prompt({
    message: `¿Deseas permitir la escritura en ${filePath}?`,
    options: [
      { name: "✅ Sí, permitir escritura", value: "Y" },
      { name: "❌ No, abortar", value: "n" },
    ],
  });

  return action === "Y";
}
