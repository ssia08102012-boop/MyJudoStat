/**
 * A missing cached asset must not leave the export modal permanently disabled.
 * The underlying task may still finish later, but the UI becomes usable again.
 */
export function withExportTimeout<T>(task: Promise<T>, timeoutMs = 20_000): Promise<T> {
  return Promise.race([
    task,
    new Promise<T>((_resolve, reject) => {
      window.setTimeout(() => reject(new Error('Export timed out')), timeoutMs)
    }),
  ])
}
