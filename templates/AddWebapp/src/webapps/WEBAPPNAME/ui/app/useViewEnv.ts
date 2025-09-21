import * as R from "react"
import {ViewEnv} from "./ViewEnv"

export function useViewEnv(): ViewEnv {
  return R.useContext(ViewEnvContext)!
}

export const ViewEnvContext = R.createContext<ViewEnv | null>(null)
