import {defineConfig} from "hanbok/tools"

// The config file generated and maintained by the "hb gen" tools
import GeneratedConfig from "./hanbok.config.json"

export default defineConfig(
  Object.assign(GeneratedConfig, {
    // App overrides to the config file
  })
)
