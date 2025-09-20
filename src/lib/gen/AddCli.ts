import * as GU from "./GenUtils"
import path from "node:path"

export type AddCliProps = {
  name: string
}

export async function addCli(props: AddCliProps) {
  const {name} = props

  console.log(`Adding CLI with executable "${name}"`)
  GU.modifyJsonFile("package.json", (j) => {
    const exportsElem = (j.exports ||= {})
    exportsElem[`./cli`] = {
      types: `./dist/cli/cli.d.ts`,
      import: `./dist/cli/cli.es.js`,
    }
    j.bin = Object.assign(j.bin ?? {}, {
      [`${name}`]: `bin/${name}`,
      [`${name}-debug`]: `bin/${name}-debug`,
    })
    j.oclif = {
      bin: name,
      commands: {
        strategy: "explicit",
        target: "./dist/cli/cli.es.js",
        identifier: "COMMANDS",
      },
      plugins: [
        "@oclif/plugin-help",
        "@oclif/plugin-not-found",
        "@oclif/plugin-autocomplete",
      ],
      topicSeparator: " ",
    }

    j.dependencies = Object.assign(
      {
        oclif: "^4.18.1",
        "source-map-support": "^0.5.21",
      },
      j.dependencies ?? {}
    )
    j.devDependencies = Object.assign(
      {
        "@oclif/core": "^4.3.3",
        "@oclif/plugin-autocomplete": "^3.2.30",
        "@oclif/plugin-help": "^6.2.28",
        "@oclif/plugin-not-found": "^3.2.56",
      },
      j.devDependencies ?? {}
    )
    return j
  })

  GU.modifyJsonFile("hanbok.config.json", (j) => {
    const featuresElem = (j.features ||= [])
    const libElem = (featuresElem.lib ||= [])
    libElem.push({name: "cli"})
    return j
  })

  GU.scaffoldFromTemplate({
    templateDir: "AddCli",
    toDestFileName: (f) => {
      const {dirname, basename} = f
      const destname = GU.removeTemplatePrefix(basename).replaceAll(
        "BINNAME",
        name
      )
      const destdirname = dirname.replaceAll("BINNAME", name)
      const executable = path.basename(dirname) === "bin"
      return {dirname: destdirname, basename: destname, executable}
    },
    toDestFileText: (f) => {
      const {templateFileName, templateText, destFileName, destText} = f
      const newDestText = templateText.replaceAll("{BINNAME}", name)
      return {destText: newDestText}
    },
  })

  console.log()
  console.log(`Remember to run 'npm install'`)
}
