import fs from "node:fs"

export function isDirectory(path: string): boolean {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory()
  } catch (e:any) {
    if (e.code === 'ENOENT') {
      return false
    } else {
      throw e
    }
  }
}
