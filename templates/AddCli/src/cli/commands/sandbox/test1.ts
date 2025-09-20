import "source-map-support/register.js"
import * as OC from "@oclif/core"

export class Command extends OC.Command {
  static override description = "A test sandbox command"

  static override args = {
    arg: OC.Args.string({
      description: "The test arg",
      required: false,
      default: "noarg",
    }),
  }

  static override flags = {
    flag: OC.Flags.string({
      char: "f",
      summary: "The test flag",
      required: false,
      default: "f1",
    }),
  }
  static override enableJsonFlag = true

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Command)
  }
}
