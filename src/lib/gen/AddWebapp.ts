import * as GU from "./GenUtils"

export type AddWebappProps = {
  name: string
}

export async function addWebapp(props: AddWebappProps) {
  const {name} = props

  console.log(`Adding webapp "${name}"`)
  GU.modifyJsonFile("package.json", (j) => {
    j.dependencies = Object.assign(
      {
        "@heroicons/react": "^2.2.0",
        "live-value": "^0.0.7",
        react: "^19.1.0",
        "react-dom": "^19.1.0",
        "react-error-boundary": "^5.0.0",
        "react-router-dom": "^7.5.2",
        zod: "^3.24.3",
      },
      j.dependencies ?? {}
    )
    j.devDependencies = Object.assign(
      {
        "@types/react": "^19.1.2",
        "@types/react-dom": "^19.1.2",
        tailwindcss: "^4.1.4",
      },
      j.devDependencies ?? {}
    )
    return j
  })

  const capName = GU.capitalize(name)
  GU.scaffoldFromTemplate({
    templateDir: "AddWebapp",
    toDestFileName: (f) => {
      const {path, dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename).replaceAll(
        "WEBAPPNAME",
        name
      )
      const destdirname = dirname.replaceAll("WEBAPPNAME", name)
      return {dirname: destdirname, basename: destname}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText.replaceAll("WEBAPPNAME", name)
      return {destText: newDestText}
    },
  })

  console.log()
  console.log(`Remember to run 'npm install'`)
}
