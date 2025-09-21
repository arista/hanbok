// A structure that can be accessed by any view through useViewEnv,
// providing global services to all views

import {Model} from "./Model"
import {Controller} from "./Controller"
import {PageContext} from "./PageContext"

export interface ViewEnv {
  model: Model
  controller: Controller
  pageContext: PageContext
}

export function createViewEnv({
  model,
  controller,
  pageContext,
}: {
  model: Model
  controller: Controller
  pageContext: PageContext
}): ViewEnv {
  return {
    model,
    controller,
    pageContext,
  }
}
