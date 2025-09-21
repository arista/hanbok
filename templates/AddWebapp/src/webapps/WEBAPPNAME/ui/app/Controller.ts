import {Model} from "./Model"
import {IRoutes} from "../../routes/Routes"

export class Controller {
  constructor(public props: {model: Model; routes: IRoutes}) {}

  get model(): Model {
    return this.props.model
  }

  get routes(): IRoutes {
    return this.props.routes
  }

  async start() {
    // Start these going asynchronously
    await this.getSampleResources()
  }

  incrementSampleValue() {
    this.model.incrementSampleValue()
  }

  async getSampleResources() {
    const resources = await this.routes.api.sampleResource.list()
    this.model.updateSampleResourcesList(resources.items)
  }

  async onDeleteSampleResource(publicId: string) {
    await this.routes.api.sampleResource.delete({params: {publicId}})
    await this.getSampleResources()
  }

  async addSampleResource() {
    const m = this.model.addSampleResourceVM.value
    if (m != null && m.canAdd.value) {
      const name = m.name.value
      const age = parseInt(m.age.value)
      await this.props.routes.api.sampleResource.create({
        body: {item: {name, age}},
      })
      await this.getSampleResources()
      this.model.resetAddSampleResource()
    }
  }
}
