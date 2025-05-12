// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
	  select?: (i: number, j: number) => void;
	}
  }

export {};
