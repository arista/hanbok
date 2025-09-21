import {useLiveValue} from "live-value"
import {useViewEnv} from "../app/useViewEnv"

export const DashboardStats = () => {
  const {model, controller} = useViewEnv()
  const val = useLiveValue(model.sampleValue)

  return (
    <>
      <div className="text-lg">The value is {val}</div>
      <div>
        <button onClick={() => controller.incrementSampleValue()}>
          Increment
        </button>
      </div>
    </>
  )
}
