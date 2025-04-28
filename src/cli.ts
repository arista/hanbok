import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PreviewCommand} from "@cli/commands/preview"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  preview: PreviewCommand,
  sample: SampleCommand,
}
