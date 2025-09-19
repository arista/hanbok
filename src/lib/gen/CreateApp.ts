import path from "node:path"
import * as GU from "./GenUtils"

export type CreateAppProps = {
  path?: string | null
  name: string
}

export async function createApp(props: CreateAppProps) {
  const name = props.name
  const appPath = props.path ?? path.resolve(".", name)

  console.log(`Generating app "${name}" to directory "${appPath}"`)

  GU.scaffoldFromTemplate({
    templateDir: "CreateApp",
    destDir: appPath,
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename)
      return {dirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText.replaceAll("{APPNAME}", name)
      return {destText: newDestText}
    },
  })

  console.log()
  console.log(`Remember to run 'npm install'`)
}
