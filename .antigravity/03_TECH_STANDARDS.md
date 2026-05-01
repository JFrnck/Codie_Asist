# ESTÁNDARES TÉCNICOS Y ARQUITECTURA

## 1. Stack Tecnológico Estricto
* **Entorno de Ejecución:** Deno (Última versión estable).
* **Framework CLI:** Cliffy (para manejo de argumentos, prompts y colores en terminal).
* **Base de Datos Local:** SQLite (para `memory.ts`).
* **Gestión de Dependencias:** Uso exclusivo de `deno.json` con `jsr:` y URLs estándar de Deno (`std@`). Prohibido Node.js/npm a menos que no exista alternativa nativa.

## 2. Patrones de Diseño Requeridos
* **Modularidad Estricta:** Las herramientas (`tools/`) no deben importar lógica de los agentes (`agents/`). Todo se registra centralizadamente en `registry.ts`.
* **Manejo de Promesas:** Uso obligatorio de `async/await` y bloques `try/catch` para todas las interacciones con APIs (LLM, Notion, Gmail) y el File System.

## 3. Convenciones de Código
* **Nomenclatura:** `camelCase` (variables/funciones), `PascalCase` (clases/tipos/interfaces), `UPPER_SNAKE_CASE` (constantes/variables de entorno). Los nombres de archivos usan `snake_case.ts` (ej. `llm_client.ts`).
* **Tipado:** TypeScript estricto. Prohibido usar `any`. Usar `unknown` si es inevitable y validar en tiempo de ejecución. Definir interfaces para los JSON Schemas de las herramientas.
* **Seguridad:** Ninguna API Key debe hardcodearse. Todas se leen mediante la bóveda `config/user_prefs.ts`.

## 4. Git y Control de Calidad
* **Formateo y Linting:** Antes de considerar un código finalizado, debe ser compatible con `deno fmt` y `deno lint` sin emitir advertencias.
* **Commits:** Conventional Commits obligatorios.