import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PrettierCommand} from "@cli/commands/prettier"
import {Command as AppServerCommand} from "@cli/commands/app-server"
import {Command as ShowConfigCommand} from "@cli/commands/show-config"
import {Command as WebappLambdaNameCommand} from "@cli/commands/webapp-lambda-name"
import {Command as CdkAppInfrastructureCommand} from "@cli/commands/cdk/app-infrastructure"
import {Command as CdkSuiteInfrastructureCommand} from "@cli/commands/cdk/suite-infrastructure"
import {Command as CdkDeployenvCommand} from "@cli/commands/cdk/deployenv"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  prettier: PrettierCommand,
  "app-server": AppServerCommand,
  sample: SampleCommand,
  "show-config": ShowConfigCommand,
  "webapp-lambda-name": WebappLambdaNameCommand,
  "cdk:app-infrastructure": CdkAppInfrastructureCommand,
  "cdk:suite-infrastructure": CdkSuiteInfrastructureCommand,
  "cdk:deployenv": CdkDeployenvCommand,
}
