import {describe, it, beforeEach} from "node:test"
import assert from "node:assert"

export async function test() {
  await describe("Sample", async () => {
    await it("should run a sample test", () => {
      assert.equal("sample", "sample")
    })
  })
}
