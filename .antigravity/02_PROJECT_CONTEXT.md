# CONTEXTO DEL PROYECTO: Codie

## 1. Visión General
Codie es una herramienta CLI de asistencia (Agente de IA) que supera al mercado actual resolviendo la "Ceguera Transversal". Conecta la productividad y el código, permitiendo entender requerimientos de negocio, comunicación (correos/documentación) y el repositorio local. Codie se compila en un único binario nativo (Windows, Mac, Linux) sin dependencias, usando un modelo BYOK (Bring Your Own Key) donde los usuarios configuran sus propias APIs.

## 2. Objetivos Claros y Medibles
* **Seguridad y Sandboxing:** Uso estricto de permisos de Deno (`--allow-read`, `--allow-run`, etc.). El entorno debe proteger los despliegues locales; cero contenedores pesados.
* **Control Human In The Loop (HITL):** Lectura de código silenciosa, pero acciones mutables (ej. `git push`, modificación de `.env`, ejecución de comandos shell) deben pausar obligatoriamente solicitando confirmación `[Y/n/Modificar]`.
* **Delegación Inteligente:** Uso del `router.ts` para derivar intenciones del usuario al `coder_agent.ts` (lógica técnica) o al `prod_agent.ts` (Notion, Gmail, gestión).

## 3. Arquitectura de Carpetas y Módulos
* `/` -> `main.ts` (Punto de entrada CLI con Cliffy), `deno.json`.
* `config/` -> `user_prefs.ts` (Lectura/escritura en `~/.codie/config.json`).
* `core/` -> `llm_client.ts` (Conexión APIs LLM), `router.ts` (Enrutador de prompts), `memory.ts` (SQLite local para historial).
* `agents/` -> `coder_agent.ts`, `prod_agent.ts`.
* `tools/` -> `system/` (`shell.ts`, `fs.ts`), `integrations/` (`github.ts`, `gmail.ts`, `notion.ts`), `registry.ts` (JSON Schema para Tool Use).
* `utils/` -> `security_hitl.ts`, `ui.ts` (Spinners, Cliffy), `auth.ts` (Tokens OAuth).

## 4. Fases de Desarrollo Estratégicas
1. **El Chasis y la Bóveda:** CLI básico, comando `codie setup` para guardar API Key segura en el home del usuario.
2. **El Cerebro y la Voz:** Bucle `while(true)` de chat interactivo, conexión al LLM, UI en consola.
3. **Las Manos Seguras:** Ejecución de bash conectada al HITL y Function Calling.
4. **El Agente Coder:** Herramientas de lectura/escritura de archivos y auto-corrección interceptando `stderr`.
5. **Productividad Transversal:** Integración OAuth Gmail, Notion y delegación de tareas vía Router.
6. **Distribución Global:** Scripts `deno compile` para binarios cruzados.