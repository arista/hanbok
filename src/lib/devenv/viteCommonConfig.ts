import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {WebappConfig} from "./ProjectModel"

export function viteCommonConfig(webapp: WebappConfig) {
  return {
    // Where index.html is located
    root: webapp.viteProjectRoot,
    base: webapp.devServerBase,
    plugins: [
      // Among other things, this makes sure "React" is defined
      // everywhere
      react(),
      tailwindcss(),
    ],
  }
}
