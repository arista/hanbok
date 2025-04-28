import {Build} from "./Build"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {globbySync} from "globby"
import fs from "node:fs"
import prettier from "prettier"
import {Options} from "prettier"
import path from "node:path"

export class Prettier {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const cwd = model.projectRoot

    const patterns = ["**/*.{ts,tsx,js,jsx,json,css,scss,html}"]
    const prettierConfig: Options = {
      trailingComma: "es5",
      semi: false,
      bracketSpacing: false,
    }
    const files = globbySync(patterns, {
      cwd,
      absolute: true,
      gitignore: true,
    })
    for (const file of files) {
      const orig = fs.readFileSync(file, "utf-8")
      const formatted = await prettier.format(orig, {
        ...prettierConfig,
        filepath: file,
      })
      if (orig !== formatted) {
        fs.writeFileSync(file, formatted, "utf-8")
        console.log(`[prettier] Formatted ${path.relative(cwd, file)}`)
      }
    }
  }
}
