import {Command as SampleCommand} from "./cli/commands/sample"
import {Command as SandboxTopic} from "./cli/commands/sandbox"
import {Command as SandboxTest1Command} from "./cli/commands/sandbox/test1"

export const COMMANDS = {
  sample: SampleCommand,
  sandbox: SandboxTopic,
  "sandbox:test1": SandboxTest1Command,
}
