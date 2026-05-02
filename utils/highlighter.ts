import { highlight } from "npm:cli-highlight";
import { colors } from "@cliffy/ansi/colors";

/**
 * Renderiza el Markdown en crudo a texto coloreado y formateado para la terminal,
 * aplicando Syntax Highlighting a los bloques de código.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  // 1. Resaltar bloques de código
  // Expresión regular: Busca ``` opcionalmente un lenguaje, salto de línea, contenido, ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  
  let formattedText = text.replace(codeBlockRegex, (match, lang, code) => {
    try {
      const language = lang ? lang.trim() : "txt";
      const highlightedCode = highlight(code, { language, ignoreIllegals: true });
      return `\`\`\`${colors.cyan(language)}\n${highlightedCode}\`\`\``;
    } catch (e) {
      // Fallback seguro: si el lenguaje no es soportado, pintar en gris
      return colors.gray(match);
    }
  });

  // 2. Resaltar código inline `codigo`
  // Solo aplicamos a texto entre backticks simples
  const inlineCodeRegex = /(?<!`)`([^`]+)`(?!`)/g;
  formattedText = formattedText.replace(inlineCodeRegex, colors.bgBlack.white(" $1 "));

  // 3. Resaltar texto en negrita **texto**
  const boldRegex = /\*\*(.*?)\*\*/g;
  formattedText = formattedText.replace(boldRegex, colors.bold("$1"));

  // 4. Resaltar texto en cursiva *texto* o _texto_
  const italicRegex = /(?<!\*)\*(.*?)\*(?!\*)|(?<!_)_(.*?)_(?!_)/g;
  formattedText = formattedText.replace(italicRegex, colors.italic("$1$2"));

  return formattedText;
}
