import * as GU from "./GenUtils"

export type AddTestProps = {}

export async function addTest(props: AddTestProps) {
  console.log(`Adding test`)

  GU.scaffoldFromTemplate({
    templateDir: "AddTest",
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename)
      const destdirname = dirname
      return {dirname: destdirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText
      return {destText: newDestText}
    },
  })

  GU.modifyJsonFile("hanbok.config.json", (j) => {
    const featuresElem = (j.features ||= [])
    featuresElem.test = true
    return j
  })
}
