export async function shareOrDownloadFile(file: File, title: string): Promise<'shared' | 'downloaded'> {
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title, files: [file] })
    return 'shared'
  }

  const url = URL.createObjectURL(file)
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
