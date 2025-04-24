import type {ChildProcess} from "node:child_process"
import process from "node:process"

export type WatcherFn = () => Promise<void | (() => Promise<void>)> // optional cleanup

export interface WatcherConfig {
  name: string
  fn: WatcherFn
}

export async function runAllWatchers(watchers: WatcherConfig[]) {
  const cleanupFns: (() => Promise<void>)[] = []

  function log(name: string, message: string) {
    console.log(`[${name}] ${message}`)
  }

  // Setup graceful shutdown
  function attachShutdown() {
    const shutdown = async () => {
      console.log("\n[hanbok] Shutting down watchers...")
      await Promise.allSettled(cleanupFns.map((fn) => fn()))
      process.exit(0)
    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  }

  attachShutdown()

  // Start all watchers
  await Promise.all(
    watchers.map(async ({name, fn}) => {
      try {
        log(name, "Starting...")
        const cleanup = await fn()
        if (cleanup) cleanupFns.push(cleanup)
        log(name, "Running")
      } catch (err) {
        log(name, `Failed: ${(err as Error).message}`)
      }
    })
  )
}
