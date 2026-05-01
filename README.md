# Codie: Tu Agente Autónomo de Ingeniería de Software Local

Codie es un asistente de Inteligencia Artificial ejecutable directamente desde tu terminal local. Funciona bajo una arquitectura Multi-Agente enfocada a la ingeniería de software y la productividad diaria.

## Características Principales

*   **Enrutador Inteligente (Semantic Router):** Codie posee un enrutador semántico veloz. Cuando escribes tu orden, un pequeño análisis inicial (1 token) decide a qué agente despachar la tarea:
    *   *Coder Agent:* Tiene acceso a tu sistema de archivos, puede listar, leer e interpretar código local o ejecutar comandos Bash (si lo permites).
    *   *Prod Agent:* Gestiona tareas de productividad interactuando con integraciones externas como Notion y Gmail.
*   **Persistencia Local en SQLite:** Todas las conversaciones, iteraciones lógicas y uso de herramientas se graban de manera persistente localmente en `~/.codie/memory.db`.
*   **Escudo HITL (Human-In-The-Loop):** Seguridad asimétrica. El agente es capaz de leer archivos de manera silenciosa para analizar el entorno rápidamente, pero **jamás escribirá o alterará un archivo ni ejecutará comandos en la consola** sin presentar primero en la terminal una vista previa (`preview`) obligando al usuario a aceptar o declinar.
*   **Auto-corrección Silenciosa:** Si Codie ejecuta un comando o intenta leer un archivo que resulta en error (ej. File Not Found), intercepta nativamente ese `stderr` devolviéndoselo a la propia IA para que se auto-corrija automáticamente antes de contestarte.
*   **Alma ("Soul"):** Codie posee un sistema de configuración de "Alma" guardado en `~/.codie/soul.md`. Es un archivo markdown editable donde puedes forjar directivas maestras personalizadas para el modelo principal.

## Instalación y Configuración

Puedes compilar e instalar Codie usando Deno nativamente en cualquier sistema operativo. Los binarios auto-contenidos quedarán en la carpeta `/bin` de tu directorio de trabajo.

1.  Asegúrate de tener [Deno](https://deno.com/) instalado.
2.  Clona el repositorio local.
3.  Ejecuta el script de compilación transversal para tu sistema operativo preferido:
    *   Mac Intel: `deno task build:mac`
    *   Mac M1/M2/M3: `deno task build:mac-m1`
    *   Windows: `deno task build:windows`
    *   Linux: `deno task build:linux`

### El Comando Setup

Una vez que tengas el binario de Codie empaquetado (o ejecutándolo desde fuente), inicializa la bóveda usando:

```bash
codie setup
```

Esto desplegará un asistente en la consola para inyectar tus variables y credenciales en `~/.codie/config.json`.
1. **OpenAI API Key (Obligatorio):** Permite el uso del cerebro central (`gpt-4o-mini`).
2. **Notion API Key (Opcional):** Permite la escritura en páginas o bases de datos de Notion para el Prod Agent.
3. **Gmail OAuth (Opcional):** Permite leer tu bandeja de correos. Exige un **Client ID** y un **Client Secret** desde Google Cloud Platform.

## Guía: Cómo Configurar Google Cloud Platform (Para Gmail)

El Agente de Productividad ("Prod Agent") requiere consultar correos electrónicos utilizando el protocolo OAuth 2.0 seguro. Para poder proporcionar el `Client ID` y el `Client Secret` en la fase de `codie setup`, sigue estos pasos exactos:

1. Visita la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un **Nuevo Proyecto** (Ej: "Codie Personal Agent").
3. Navega hacia **APIs y Servicios** > **Biblioteca**.
4. Busca y habilita la **Gmail API**.
5. Ve a **APIs y Servicios** > **Pantalla de Consentimiento de OAuth**.
   * Elige tipo de usuario **Externo** o **Interno** (Interno si tienes Google Workspace, Externo si usas cuenta pública de @gmail).
   * Rellena el nombre de la app (Ej: "Codie Agent") y un correo de contacto de desarrollador.
   * En "Permisos" (Scopes), añade explícitamente el permiso: `.../auth/gmail.readonly` (para garantizar lectura de seguridad sin derecho a enviar correos a tu nombre).
   * Añade tu propio correo electrónico personal en **Usuarios de Prueba**.
6. Ve a **APIs y Servicios** > **Credenciales**.
7. Haz clic en **Crear Credenciales** > **ID de cliente de OAuth**.
8. En Tipo de Aplicación elige **App de Escritorio** (Desktop App).
9. ¡Listo! Se generará tu **Client ID** y tu **Client Secret**. Cópialos y pégalos cuando ejecutes `codie setup`.
