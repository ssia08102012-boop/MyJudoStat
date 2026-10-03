type ExportWindow = Window | null

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * iOS rejects a newly opened document after a long async PDF/XLSX build.
 * Reserve the tab synchronously in the button click, then load the finished
 * file into it. This is also a reliable fallback when Web Share is unavailable.
 */
export function prepareFileTarget(): ExportWindow {
  return isIOS() ? window.open('', '_blank') : null
}

export async function shareOrDownloadFile(file: File, title: string, target: ExportWindow = null): Promise<'shared' | 'downloaded' | 'opened'> {
  const url = URL.createObjectURL(file)

  if (target) {
    target.location.replace(url)
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return 'opened'
  }

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try {
      await navigator.share({ title, files: [file] })
      URL.revokeObjectURL(url)
      return 'shared'
    } catch (reason) {
      if ((reason as DOMException).name === 'AbortError') {
        URL.revokeObjectURL(url)
        throw reason
      }
      // Continue to the ordinary download fallback if this browser rejects a file share.
    }
  }

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // iOS Safari може скасувати завантаження, якщо URL відкликати відразу після click().
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'downloaded'
}
