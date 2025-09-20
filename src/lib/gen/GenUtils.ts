import {packageDirectorySync} from "pkg-dir"
import {fileURLToPath} from "url"
import path from "node:path"
import fs from "node:fs"
import fg from "fast-glob"
import * as FU from "@lib/utils/FsUtils"

export function modifyJsonFile(filePath: string, f: (j: any) => any) {
  const packageRoot = packageDirectorySync()
  if (packageRoot == null) {
    throw new Error(`Must be run from within a hanbok project`)
  }
  const fullPath = path.join(packageRoot, filePath)
  const before = JSON.parse(fs.readFileSync(fullPath).toString())
  const after = f(before)
  console.log(`Modifying ${filePath}`)
  fs.writeFileSync(fullPath, JSON.stringify(after, null, 2))
}

export function removeTemplatePrefix(str: string): string {
  return str.startsWith("template-") ? str.substring("template-".length) : str
}

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
  executable?: boolean
}

export type DestFileText = {
  destText: string
}

export function scaffoldFromTemplate(props: {
  templateDir: string
  destDir?: string
  toDestFileName: (f: TemplateFileName) => DestFileName | null
  toDestFileText: (f: TemplateFile) => DestFileText | null
}) {
  const {templateDir, toDestFileName, toDestFileText} = props
  const destDir = props.destDir ?? packageDirectorySync()
  if (destDir == null) {
    throw new Error(`Must be run from within a hanbok project`)
  }
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
      const {dirname, basename, executable} = destFileName
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
        if (executable) {
          fs.chmodSync(fullDestPath, 0o755)
        }
      }
    }
  }
}

export function capitalize(str: string): string {
  return str.length > 0 ? str[0]!.toUpperCase() + str.slice(1) : str
}
