import {createLambdaAppServer} from "hanbok/server"
import {AppServer} from "./AppServer"
import type {AppServerProps} from "./AppServer"

export class LambdaAppServer<C extends AppServerProps> extends AppServer<C> {
  constructor(props: C) {
    super(props)
  }
}

// The "any" prevents TS from trying to bring in all the Lambda types
export const handler: any = createLambdaAppServer(async (props) => {
  await new LambdaAppServer(props).initialize()
})
