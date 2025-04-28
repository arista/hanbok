import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PreviewCommand} from "@cli/commands/preview"
import {Command as PrettierCommand} from "@cli/commands/prettier"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  preview: PreviewCommand,
  prettier: PrettierCommand,
  sample: SampleCommand,
}
