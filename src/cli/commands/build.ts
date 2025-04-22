import * as OC from "@oclif/core"
import {Build} from "@lib/devenv/Build"

export class Command extends OC.Command {
  static override description = "Build the project";

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true;

  async run() {
    const { args, flags } = await this.parse(Command);
    return await (async () => {
      return await new Build({}).run()
    })();
  }
}
