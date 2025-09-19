import fs from "node:fs"
import path from "node:path"
import {scaffoldFromTemplate} from "@lib/utils/ScaffoldFromTemplate"

export type CreateAppProps = {
  path?: string | null
  name: string
}

export async function createApp(props: CreateAppProps) {
  const name = props.name
  const appPath = props.path ?? path.resolve(".", name)

  console.log(`Generating app "${name}" to directory "${appPath}"`)

  scaffoldFromTemplate({
    templateDir: "CreateApp",
    destDir: appPath,
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = basename.startsWith("template-")
        ? basename.substring("template-".length)
        : basename
      return {dirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText.replaceAll("{APPNAME}", name)
      return {destText: newDestText}
    },
  })
}
