# FLUJO DE TRABAJO OBLIGATORIO DE ANTIGRAVITY

Para cada tarea asignada, DEBES seguir estrictamente esta secuencia sin saltar pasos.

### Fase 1: Análisis (Think)
1. Lee la solicitud del usuario.
2. Identifica en qué "Fase de Desarrollo" de `02_PROJECT_CONTEXT.md` se encuentra la tarea.
3. Enumera los archivos de la arquitectura modular (`codie-cli/`) que se verán afectados. Si necesitas crear una herramienta, asegúrate de planear su registro en `registry.ts`.

### Fase 2: Planificación (Plan)
1. Genera un plan de pasos técnicos y estructurados.
2. Muestra el plan al usuario y espera la aprobación explícita ("Procede").
   * *Excepción:* Si la instrucción inicial del usuario dice "Ejecuta directamente" o provee una acción directa sin requerir feedback, salta la validación.

### Fase 3: Ejecución (Execute)
1. Escribe el código completo en TypeScript usando el estándar de Deno. NO uses *placeholders* como `// resto de la lógica aquí`.
2. Aplica inyección de dependencias o paso de configuraciones según corresponda a la arquitectura.
3. Asegura el manejo de errores capturando fallos (`stderr`) para la auto-corrección de Codie.

### Fase 4: Verificación (Verify)
1. Valida mentalmente que el código no elude `security_hitl.ts` en operaciones mutables.
2. Si el código requiere actualizar `deno.json` (nuevos imports o permisos en `tasks`), proporciona el bloque JSON actualizado.