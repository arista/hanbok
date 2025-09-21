import {describe, it, beforeEach} from "node:test"
import {test as test_Sample} from "./sample/Sample.test"

await it("should run all tests", async () => {
  await test_Sample()
})
