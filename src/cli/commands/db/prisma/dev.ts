import "source-map-support/register.js"
import * as OC from "@oclif/core"
import * as PU from "@lib/utils/PrismaUtils"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import * as PM from "@lib/devenv/ProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"

export class Command extends OC.Command {
  static override description = `Execute a prisma command for the dev database of one of the services, or for all of the services.  Specify the --service (if any), followed by "--", followed by the flags and arguments you wish to pass to prisma`

  static override args = {}
  static override strict = false
  static override flags = {
    service: OC.Flags.string({
      char: "s",
      description: `The service whose prisma schema is to be used (if not specified, prisma will be run for all services)`,
      required: false,
      default: "",
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {flags, argv} = await this.parse(Command)
    const argvStrings = argv.map((s) => `${s}`)
    const {service} = flags
    const projectModel = await createProjectModel({})
    const services = projectModel.features?.services
    if (services == null) {
      throw new Error(`project config does not specify features.services`)
    }
    if (service === "") {
      for (const serviceModel of Object.values(services)) {
        const databaseUrl = PU.devDatabaseUrl({
          projectModel,
          service: serviceModel,
        })
        console.log(`Running prisma command for service "${serviceModel.name}"`)
        await PU.runPrisma({
          projectModel,
          service: serviceModel,
          args: argvStrings,
          databaseUrl,
        })
      }
    } else {
      const serviceModel = services[service]
      if (serviceModel == null) {
        throw new Error(`service "${service}" not found`)
      }
      const databaseUrl = PU.devDatabaseUrl({
        projectModel,
        service: serviceModel,
      })
      await PU.runPrisma({
        projectModel,
        service: serviceModel,
        args: argvStrings,
        databaseUrl,
      })
    }
  }
}
