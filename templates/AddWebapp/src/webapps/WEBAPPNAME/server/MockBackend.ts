import {z} from "zod"
import * as RT from "../routes/RouteTypes"
import short from "short-uuid"

export class MockBackend {
  constructor(public props: {}) {}

  _sampleResource?: MockSampleResourceBackend
  get sampleResource(): MockSampleResourceBackend {
    return (this._sampleResource ??= (() => {
      return new MockSampleResourceBackend({})
    })())
  }
}

export class MockSampleResourceBackend {
  constructor(public props: {}) {
    const items: Array<RT.SampleResource.Resource> = [
      {
        publicId: short.generate(),
        name: "Jean",
        age: 14,
      },
      {
        publicId: short.generate(),
        name: "Will",
        age: 33,
      },
    ]
    for (const item of items) {
      this.byPublicId.set(item.publicId, item)
    }
  }

  byPublicId = new Map<string, RT.SampleResource.Resource>()
}
