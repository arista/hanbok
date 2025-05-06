import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PrettierCommand} from "@cli/commands/prettier"
import {Command as ApiServerCommand} from "@cli/commands/api-server"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  prettier: PrettierCommand,
  "api-server": ApiServerCommand,
  sample: SampleCommand,
}
