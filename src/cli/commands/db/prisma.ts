import "source-map-support/register.js"
import * as OC from "@oclif/core"

export class Command extends OC.Command {
  static override description =
    "Commands for running prisma commands against app databases"
  async run() {}
}
