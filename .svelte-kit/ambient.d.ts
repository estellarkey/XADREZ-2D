
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const ELECTRON_RUN_AS_NODE: string;
	export const BAMF_DESKTOP_FILE_HINT: string;
	export const CHROME_DESKTOP: string;
	export const CLUTTER_DISABLE_MIPMAPPED_TEXT: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const DESKTOP_SESSION: string;
	export const DISPLAY: string;
	export const ELECTRON_NO_ATTACH_CONSOLE: string;
	export const FONTCONFIG_FILE: string;
	export const FONTCONFIG_PATH: string;
	export const GDK_BACKEND: string;
	export const GDK_PIXBUF_MODULEDIR: string;
	export const GDK_PIXBUF_MODULE_FILE: string;
	export const GDMSESSION: string;
	export const GIO_LAUNCHED_DESKTOP_FILE: string;
	export const GIO_LAUNCHED_DESKTOP_FILE_PID: string;
	export const GIO_MODULE_DIR: string;
	export const GJS_DEBUG_OUTPUT: string;
	export const GJS_DEBUG_TOPICS: string;
	export const GNOME_DESKTOP_SESSION_ID: string;
	export const GNOME_SETUP_DISPLAY: string;
	export const GNOME_SHELL_SESSION_MODE: string;
	export const GSETTINGS_SCHEMA_DIR: string;
	export const GSM_SKIP_SSH_AGENT_WORKAROUND: string;
	export const GTK_EXE_PREFIX: string;
	export const GTK_IM_MODULE_FILE: string;
	export const GTK_MODULES: string;
	export const GTK_PATH: string;
	export const HOME: string;
	export const INVOCATION_ID: string;
	export const JOURNAL_STREAM: string;
	export const LANG: string;
	export const LESS: string;
	export const LOCPATH: string;
	export const LOGNAME: string;
	export const LSCOLORS: string;
	export const MANAGERPID: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const NVM_BIN: string;
	export const NVM_CD_FLAGS: string;
	export const NVM_DIR: string;
	export const NVM_INC: string;
	export const OLDPWD: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const PAGER: string;
	export const PATH: string;
	export const PWD: string;
	export const PYTHONHOME: string;
	export const PYTHONPATH: string;
	export const QT_ACCESSIBILITY: string;
	export const QT_IM_MODULE: string;
	export const SESSION_MANAGER: string;
	export const SHELL: string;
	export const SHLVL: string;
	export const SNAP: string;
	export const SNAP_ARCH: string;
	export const SNAP_COMMON: string;
	export const SNAP_CONTEXT: string;
	export const SNAP_COOKIE: string;
	export const SNAP_DATA: string;
	export const SNAP_EUID: string;
	export const SNAP_INSTANCE_NAME: string;
	export const SNAP_LAUNCHER_ARCH_TRIPLET: string;
	export const SNAP_LIBRARY_PATH: string;
	export const SNAP_NAME: string;
	export const SNAP_REAL_HOME: string;
	export const SNAP_REVISION: string;
	export const SNAP_UID: string;
	export const SNAP_USER_COMMON: string;
	export const SNAP_USER_DATA: string;
	export const SNAP_VERSION: string;
	export const SSH_AUTH_SOCK: string;
	export const SYSTEMD_EXEC_PID: string;
	export const USER: string;
	export const USERNAME: string;
	export const VSCODE_CLI: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const VSCODE_CWD: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const VSCODE_IPC_HOOK: string;
	export const VSCODE_NLS_CONFIG: string;
	export const VSCODE_PID: string;
	export const WAYLAND_DISPLAY: string;
	export const XAUTHORITY: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const XDG_DATA_DIRS: string;
	export const XDG_DATA_DIRS_VSCODE_SNAP_ORIG: string;
	export const XDG_DATA_HOME: string;
	export const XDG_MENU_PREFIX: string;
	export const XDG_RUNTIME_DIR: string;
	export const XDG_SESSION_CLASS: string;
	export const XDG_SESSION_DESKTOP: string;
	export const XDG_SESSION_TYPE: string;
	export const XMODIFIERS: string;
	export const ZSH: string;
	export const _: string;
	export const APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
	export const APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
	export const VSCODE_L10N_BUNDLE_LOCATION: string;
	export const ELECTRON_NO_ASAR: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		ELECTRON_RUN_AS_NODE: string;
		BAMF_DESKTOP_FILE_HINT: string;
		CHROME_DESKTOP: string;
		CLUTTER_DISABLE_MIPMAPPED_TEXT: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		DESKTOP_SESSION: string;
		DISPLAY: string;
		ELECTRON_NO_ATTACH_CONSOLE: string;
		FONTCONFIG_FILE: string;
		FONTCONFIG_PATH: string;
		GDK_BACKEND: string;
		GDK_PIXBUF_MODULEDIR: string;
		GDK_PIXBUF_MODULE_FILE: string;
		GDMSESSION: string;
		GIO_LAUNCHED_DESKTOP_FILE: string;
		GIO_LAUNCHED_DESKTOP_FILE_PID: string;
		GIO_MODULE_DIR: string;
		GJS_DEBUG_OUTPUT: string;
		GJS_DEBUG_TOPICS: string;
		GNOME_DESKTOP_SESSION_ID: string;
		GNOME_SETUP_DISPLAY: string;
		GNOME_SHELL_SESSION_MODE: string;
		GSETTINGS_SCHEMA_DIR: string;
		GSM_SKIP_SSH_AGENT_WORKAROUND: string;
		GTK_EXE_PREFIX: string;
		GTK_IM_MODULE_FILE: string;
		GTK_MODULES: string;
		GTK_PATH: string;
		HOME: string;
		INVOCATION_ID: string;
		JOURNAL_STREAM: string;
		LANG: string;
		LESS: string;
		LOCPATH: string;
		LOGNAME: string;
		LSCOLORS: string;
		MANAGERPID: string;
		MEMORY_PRESSURE_WATCH: string;
		MEMORY_PRESSURE_WRITE: string;
		NVM_BIN: string;
		NVM_CD_FLAGS: string;
		NVM_DIR: string;
		NVM_INC: string;
		OLDPWD: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		PAGER: string;
		PATH: string;
		PWD: string;
		PYTHONHOME: string;
		PYTHONPATH: string;
		QT_ACCESSIBILITY: string;
		QT_IM_MODULE: string;
		SESSION_MANAGER: string;
		SHELL: string;
		SHLVL: string;
		SNAP: string;
		SNAP_ARCH: string;
		SNAP_COMMON: string;
		SNAP_CONTEXT: string;
		SNAP_COOKIE: string;
		SNAP_DATA: string;
		SNAP_EUID: string;
		SNAP_INSTANCE_NAME: string;
		SNAP_LAUNCHER_ARCH_TRIPLET: string;
		SNAP_LIBRARY_PATH: string;
		SNAP_NAME: string;
		SNAP_REAL_HOME: string;
		SNAP_REVISION: string;
		SNAP_UID: string;
		SNAP_USER_COMMON: string;
		SNAP_USER_DATA: string;
		SNAP_VERSION: string;
		SSH_AUTH_SOCK: string;
		SYSTEMD_EXEC_PID: string;
		USER: string;
		USERNAME: string;
		VSCODE_CLI: string;
		VSCODE_CODE_CACHE_PATH: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		VSCODE_CWD: string;
		VSCODE_ESM_ENTRYPOINT: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		VSCODE_IPC_HOOK: string;
		VSCODE_NLS_CONFIG: string;
		VSCODE_PID: string;
		WAYLAND_DISPLAY: string;
		XAUTHORITY: string;
		XDG_CURRENT_DESKTOP: string;
		XDG_DATA_DIRS: string;
		XDG_DATA_DIRS_VSCODE_SNAP_ORIG: string;
		XDG_DATA_HOME: string;
		XDG_MENU_PREFIX: string;
		XDG_RUNTIME_DIR: string;
		XDG_SESSION_CLASS: string;
		XDG_SESSION_DESKTOP: string;
		XDG_SESSION_TYPE: string;
		XMODIFIERS: string;
		ZSH: string;
		_: string;
		APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
		APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
		VSCODE_L10N_BUNDLE_LOCATION: string;
		ELECTRON_NO_ASAR: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
