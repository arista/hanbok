import {describe, it, beforeEach} from "node:test"
import {tests as createProjectModel_tests} from "@test/lib/devenv/createProjectModel.test"

await it("should run all tests", async () => {
  await Promise.all([createProjectModel_tests()])
})
