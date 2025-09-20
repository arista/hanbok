import * as GU from "./GenUtils"

export type AddServiceProps = {
  name: string
}

export async function addService(props: AddServiceProps) {
  const {name} = props

  console.log(`Adding service "${name}"`)
  GU.modifyJsonFile("package.json", (j) => {
    j.dependencies = Object.assign(
      {
        "@prisma/client": "^6.6.0",
      },
      j.dependencies ?? {}
    )
    j.devDependencies = Object.assign(
      {
        prisma: "^6.6.0",
      },
      j.devDependencies ?? {}
    )
    return j
  })

  const capName = GU.capitalize(name)
  GU.scaffoldFromTemplate({
    templateDir: "AddService",
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename)
        .replaceAll("ORIGSERVICENAME", name)
        .replaceAll("CAPSERVICENAME", capName)
      const destdirname = dirname.replaceAll("ORIGSERVICENAME", name)
      return {dirname: destdirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText
        .replaceAll("ORIGSERVICENAME", name)
        .replaceAll("CAPSERVICENAME", capName)
      return {destText: newDestText}
    },
  })

  console.log()
  console.log(`Remember to run 'npm install'`)
}
