import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  sample: SampleCommand,
}
