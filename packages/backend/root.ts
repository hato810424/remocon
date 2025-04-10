import { fileURLToPath } from "node:url";
import path from "node:path";

export const __filename = fileURLToPath(import.meta.url);
export const root = path.dirname(__filename);
