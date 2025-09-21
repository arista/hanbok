import {LiveValue} from "live-value"
import * as RT from "../../routes/RouteTypes"

export class Model {
  constructor(public props: {}) {}

  sampleValue = new LiveValue<number>(0)

  sampleResources = new LiveValue<Array<SampleResourceVM>>([])

  incrementSampleValue() {
    this.sampleValue.value++
  }

  updateSampleResourcesList(list: Array<RT.SampleResource.Resource>) {
    this.sampleResources.value = list.map((src) => {
      return {
        src: {
          publicId: src.publicId,
          name: src.name,
          age: src.age ?? null,
        },
      }
    })
  }

  addSampleResourceVM = new LiveValue<AddSampleResourceVM>(
    new AddSampleResourceVM()
  )

  resetAddSampleResource() {
    this.addSampleResourceVM.value = new AddSampleResourceVM()
  }
}

export type SampleResourceVM = {
  src: {
    publicId: string
    name: string
    age: number | null
  }
}

export class AddSampleResourceVM {
  name = new LiveValue<string>("")
  age = new LiveValue<string>("")
  canAdd = new LiveValue<boolean>(() => this.computeCanAdd())

  computeCanAdd() {
    return this.name.value.trim().length > 0 && !isNaN(parseInt(this.age.value))
  }

  setName(val: string) {
    this.name.value = val
  }

  setAge(val: string) {
    this.age.value = val
  }
}
