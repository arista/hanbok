import {packageDirectorySync} from "pkg-dir"
import {fileURLToPath} from "url"
import fg from "fast-glob"
import path from "node:path"
import fs from "node:fs"
import * as FU from "@lib/utils/FsUtils"

export type TemplateFileName = {
  path: string
  dirname: string
  basename: string
}

export type TemplateFile = {
  templateFileName: TemplateFileName
  templateText: string
  destFileName: DestFileName
  destText: string | null
}

export type DestFileName = {
  dirname: string
  basename: string
}

export type DestFileText = {
  destText: string
}

export function scaffoldFromTemplate(props: {
  templateDir: string
  destDir: string
  toDestFileName: (f: TemplateFileName) => DestFileName | null
  toDestFileText: (f: TemplateFile) => DestFileText | null
}) {
  const {templateDir, destDir, toDestFileName, toDestFileText} = props
  const hanbokRoot = packageDirectorySync({
    cwd: fileURLToPath(import.meta.url),
  })!
  const fullTemplateDir = path.join(hanbokRoot, "templates", templateDir)
  const entries = fg.sync([`./**`], {cwd: fullTemplateDir, dot: true})
  for (const entry of entries) {
    const fullPath = path.join(fullTemplateDir, entry)
    const templateText = fs.readFileSync(fullPath, {encoding: "utf-8"})
    const templateFileName: TemplateFileName = {
      path: entry,
      dirname: path.dirname(entry),
      basename: path.basename(entry),
    }
    const destFileName = toDestFileName(templateFileName)
    if (destFileName != null) {
      const {dirname, basename} = destFileName
      const destPath = path.join(dirname, basename)
      const fullDestPath = path.join(destDir, destPath)
      const destText = FU.isFile(fullDestPath)
        ? fs.readFileSync(fullDestPath, {encoding: "utf-8"})
        : null
      const templateFile: TemplateFile = {
        templateFileName,
        templateText,
        destFileName,
        destText,
      }
      const destFileText = toDestFileText(templateFile)
      if (destFileText != null) {
        const fullDestDir = path.dirname(fullDestPath)
        fs.mkdirSync(fullDestDir, {recursive: true})
        console.log(`Writing ${destPath}`)
        fs.writeFileSync(fullDestPath, destFileText.destText, {
          encoding: "utf-8",
        })
      }
    }
  }
}
