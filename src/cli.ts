import {Command as SampleCommand} from "@cli/commands/sample"
import {Command as BuildCommand} from "@cli/commands/build"
import {Command as DevCommand} from "@cli/commands/dev"
import {Command as PrettierCommand} from "@cli/commands/prettier"
import {Command as AppServerCommand} from "@cli/commands/app-server"
import {Command as ShowConfigCommand} from "@cli/commands/show-config"
import {Command as WebappLambdaNameCommand} from "@cli/commands/webapp-lambda-name"
import {Command as DbTopic} from "@cli/commands/db"
import {Command as DbDevCommand} from "@cli/commands/db/dev"
import {Command as DbBackendCommand} from "@cli/commands/db/backend"
import {Command as DbTunnelCommand} from "@cli/commands/db/tunnel"
import {Command as DbAdminCommand} from "@cli/commands/db/admin"
import {Command as DbCreateAppUserCommand} from "@cli/commands/db/create-app-user"
import {Command as DbDropAppUserCommand} from "@cli/commands/db/drop-app-user"
import {Command as DbCreateBackendDatabasesCommand} from "@cli/commands/db/create-backend-databases"
import {Command as DbDropBackendDatabasesCommand} from "@cli/commands/db/drop-backend-databases"
import {Command as DbPrismaTopic} from "@cli/commands/db/prisma"
import {Command as DbPrismaDevCommand} from "@cli/commands/db/prisma/dev"
import {Command as DbPrismaBackendCommand} from "@cli/commands/db/prisma/backend"
import {Command as CdkTopic} from "@cli/commands/cdk"
import {Command as CdkAppInfrastructureCommand} from "@cli/commands/cdk/app-infrastructure"
import {Command as CdkSuiteInfrastructureCommand} from "@cli/commands/cdk/suite-infrastructure"
import {Command as CdkDeployenvCommand} from "@cli/commands/cdk/deployenv"
import {Command as CdkBackendCommand} from "@cli/commands/cdk/backend"
import {Command as GenTopic} from "@cli/commands/gen"
import {Command as GenCreateAppCommand} from "@cli/commands/gen/create-app"
import {Command as GenAddLib} from "@cli/commands/gen/add-lib"
import {Command as GenAddCli} from "@cli/commands/gen/add-cli"
import {Command as GenAddTest} from "@cli/commands/gen/add-test"
import {Command as GenAddService} from "@cli/commands/gen/add-service"
import {Command as GenAddWebapp} from "@cli/commands/gen/add-webapp"

export const COMMANDS = {
  build: BuildCommand,
  dev: DevCommand,
  prettier: PrettierCommand,
  "app-server": AppServerCommand,
  sample: SampleCommand,
  "show-config": ShowConfigCommand,
  "webapp-lambda-name": WebappLambdaNameCommand,
  db: DbTopic,
  "db:dev": DbDevCommand,
  "db:backend": DbBackendCommand,
  "db:tunnel": DbTunnelCommand,
  "db:admin": DbAdminCommand,
  "db:create-app-user": DbCreateAppUserCommand,
  "db:drop-app-user": DbDropAppUserCommand,
  "db:create-backend-databases": DbCreateBackendDatabasesCommand,
  "db:drop-backend-databases": DbDropBackendDatabasesCommand,
  "db:prisma": DbPrismaTopic,
  "db:prisma:dev": DbPrismaDevCommand,
  "db:prisma:backend": DbPrismaBackendCommand,
  cdk: CdkTopic,
  "cdk:app-infrastructure": CdkAppInfrastructureCommand,
  "cdk:suite-infrastructure": CdkSuiteInfrastructureCommand,
  "cdk:deployenv": CdkDeployenvCommand,
  "cdk:backend": CdkBackendCommand,
  gen: GenTopic,
  "gen:create-app": GenCreateAppCommand,
  "gen:add-lib": GenAddLib,
  "gen:add-cli": GenAddCli,
  "gen:add-test": GenAddTest,
  "gen:add-service": GenAddService,
  "gen:add-webapp": GenAddWebapp,
}
