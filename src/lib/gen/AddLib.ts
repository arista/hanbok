import * as GU from "./GenUtils"

export type AddLibProps = {
  name: string
}

export async function addLib(props: AddLibProps) {
  const {name} = props

  console.log(`Adding library "${name}"`)
  GU.modifyJsonFile("package.json", (j) => {
    const exportsElem = (j.exports ||= {})
    exportsElem[`./${name}`] = {
      types: `./dist/${name}/${name}.d.ts`,
      import: `./dist/${name}/${name}.es.js`,
    }
    return j
  })

  GU.modifyJsonFile("hanbok.config.json", (j) => {
    const featuresElem = (j.features ||= [])
    const libElem = (featuresElem.lib ||= [])
    libElem.push({name})
    return j
  })

  GU.scaffoldFromTemplate({
    templateDir: "AddLib",
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename).replaceAll(
        "LIBNAME",
        name
      )
      const destdirname = dirname.replaceAll("LIBNAME", name)
      return {dirname: destdirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText.replaceAll("{LIBNAME}", name)
      return {destText: newDestText}
    },
  })

  console.log()
  console.log(`Remember to run 'npm install'`)
}
