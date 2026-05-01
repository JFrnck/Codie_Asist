import { colors } from "@cliffy/ansi/colors";

export class CodieSpinner {
  private static frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private static interval: number | null = null;
  private static text = "";

  static start(text = "Pensando...") {
    this.text = text;
    let i = 0;
    
    // Ocultar cursor
    Deno.stdout.writeSync(new TextEncoder().encode('\x1B[?25l'));
    
    this.interval = setInterval(() => {
      const frame = this.frames[i % this.frames.length];
      const message = `\r${colors.blue(frame)} ${colors.gray(this.text)}`;
      Deno.stdout.writeSync(new TextEncoder().encode(message));
      i++;
    }, 80);
  }

  static stop(clear = true) {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
      
      // Mostrar cursor
      Deno.stdout.writeSync(new TextEncoder().encode('\x1B[?25h'));
      
      if (clear) {
        // Limpiar línea actual
        Deno.stdout.writeSync(new TextEncoder().encode('\r\x1B[K'));
      }
    }
  }
}
