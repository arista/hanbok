import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PrettierCommand} from "@cli/commands/prettier"
import {Command as AppServerCommand} from "@cli/commands/app-server"
import {Command as ShowConfigCommand} from "@cli/commands/show-config"
import {Command as WebappLambdaNameCommand} from "@cli/commands/webapp-lambda-name"
import {Command as DbDevCommand} from "@cli/commands/db-dev"
import {Command as DbTunnelCommand} from "@cli/commands/db-tunnel"
import {Command as DbAdminCommand} from "@cli/commands/db-admin"
import {Command as DbCreateAppUserCommand} from "@cli/commands/db-create-app-user"
import {Command as DbDropAppUserCommand} from "@cli/commands/db-drop-app-user"
import {Command as DbCreateBackendDatabasesCommand} from "@cli/commands/db-create-backend-databases"
import {Command as DbPrismaDevCommand} from "@cli/commands/prisma-dev"
import {Command as CdkAppInfrastructureCommand} from "@cli/commands/cdk/app-infrastructure"
import {Command as CdkSuiteInfrastructureCommand} from "@cli/commands/cdk/suite-infrastructure"
import {Command as CdkDeployenvCommand} from "@cli/commands/cdk/deployenv"
import {Command as CdkBackendCommand} from "@cli/commands/cdk/backend"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  prettier: PrettierCommand,
  "app-server": AppServerCommand,
  sample: SampleCommand,
  "show-config": ShowConfigCommand,
  "webapp-lambda-name": WebappLambdaNameCommand,
  "db-dev": DbDevCommand,
  "db-tunnel": DbTunnelCommand,
  "db-admin": DbAdminCommand,
  "db-create-app-user": DbCreateAppUserCommand,
  "db-drop-app-user": DbDropAppUserCommand,
  "db-create-backend-databases": DbCreateBackendDatabasesCommand,
  "prisma-dev": DbPrismaDevCommand,
  "cdk:app-infrastructure": CdkAppInfrastructureCommand,
  "cdk:suite-infrastructure": CdkSuiteInfrastructureCommand,
  "cdk:deployenv": CdkDeployenvCommand,
  "cdk:backend": CdkBackendCommand,
}
