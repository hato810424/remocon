import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default { 
  title: "Vite + React + TS", 
  prerender: true,

  extends: [vikeReact],
} satisfies Config;
