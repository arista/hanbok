import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PrettierCommand} from "@cli/commands/prettier"
import {Command as AppServerCommand} from "@cli/commands/app-server"
import {Command as ShowConfigCommand} from "@cli/commands/show-config"
import {Command as CdkInfrastructureCommand} from "@cli/commands/cdk/infrastructure"
import {Command as CdkDeployenvCommand} from "@cli/commands/cdk/deployenv"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  prettier: PrettierCommand,
  "app-server": AppServerCommand,
  sample: SampleCommand,
  "show-config": ShowConfigCommand,
  "cdk:infrastructure": CdkInfrastructureCommand,
  "cdk:deployenv": CdkDeployenvCommand,
}
