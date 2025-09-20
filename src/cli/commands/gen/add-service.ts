import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {addService} from "@lib/gen/AddService"

export class Command extends OC.Command {
  static override description =
    "Adds a service with a prisma schema.  The name of the service will be used as part of the database name."

  static override args = {
    name: OC.Args.string({
      description: `The name of the service to add`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {name} = args
    return await (async () => {
      await addService({
        name,
      })
    })()
  }
}
