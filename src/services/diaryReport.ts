import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '@/assets/logo-rys.png'
import fontUrl from '@/assets/DejaVuSans.ttf?url'
import { t } from '@/services/i18n'
import type { Profile, TrainingEntry, TrainingMetric } from '@/types'

function base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let output = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    output += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(output)
}

async function assetDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return `data:${blob.type};base64,${base64(await blob.arrayBuffer())}`
}

function entryMetrics(entry: TrainingEntry): TrainingMetric[] {
  if (entry.metrics?.length) return entry.metrics.filter((metric) => metric.name.trim())
  const legacy: Array<[keyof TrainingEntry, string]> = [
    ['throws', t('throws')], ['techniques', t('techniques')], ['fights', t('trainingFights')],
    ['pullUps', t('pullUps')], ['abs', t('abs')], ['bands', t('bands')],
  ]
  return legacy.map(([key, name]) => ({ id: `legacy-${key}`, name, value: Number(entry[key]) || 0 })).filter((metric) => metric.value > 0)
}

function formatWork(entry: TrainingEntry): string {
  const metrics = entryMetrics(entry)
  return metrics.length
    ? metrics.map((metric) => `${metric.name}: ${metric.value}${metric.sets && metric.sets.length > 1 ? ` (${metric.sets.join(' + ')})` : ''}`).join('\n')
    : t('reportEmpty')
}

function workSummary(entries: TrainingEntry[]) {
  const summary = new Map<string, { name: string, total: number, bestSet: number, bestWorkout: number }>()
  entries.forEach((entry) => {
    const totalsInWorkout = new Map<string, number>()
    entryMetrics(entry).forEach((metric) => {
      const key = metric.name.trim().toLocaleLowerCase()
      if (!key) return
      const current = summary.get(key) ?? { name: metric.name.trim(), total: 0, bestSet: 0, bestWorkout: 0 }
      current.total += metric.value
      current.bestSet = Math.max(current.bestSet, metric.bestSet ?? Math.max(...(metric.sets ?? [metric.value]), 0))
      summary.set(key, current)
      totalsInWorkout.set(key, (totalsInWorkout.get(key) ?? 0) + metric.value)
    })
    totalsInWorkout.forEach((total, key) => {
      const current = summary.get(key)
      if (current) current.bestWorkout = Math.max(current.bestWorkout, total)
    })
  })
  return [...summary.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function dateTime(): string {
  return new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function initials(name: string | undefined): string {
  if (!name?.trim()) return t('reportEmpty')
  return `${name.trim().split(/\s+/).map((part) => part[0]?.toLocaleUpperCase()).filter(Boolean).join('. ')}.`
}

export async function createDiaryReport(entries: TrainingEntry[], profile: Profile, from: string, to: string): Promise<File> {
  const [font, logo] = await Promise.all([assetDataUrl(fontUrl), assetDataUrl(logoUrl)])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('DejaVuSans.ttf', font.split(',')[1])
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
  doc.setFont('DejaVu')

  const orange: [number, number, number] = [195, 90, 0]
  const dark: [number, number, number] = [28, 35, 42]
  const muted: [number, number, number] = [95, 104, 112]
  const period = `${from} - ${to}`
  const fileName = `MyJudoStat-${from}-${to}.pdf`

  doc.setFillColor(...dark)
  doc.rect(0, 0, 210, 38, 'F')
  doc.addImage(logo, 'PNG', 16, 8, 22, 22)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('MY JUDO STAT', 44, 18)
  doc.setFontSize(10)
  doc.setTextColor(...orange)
  doc.text(t('reportDiaryTitle').toUpperCase(), 44, 25)
  doc.setTextColor(...muted)
  doc.setFontSize(8)
  doc.text(`${t('reportGenerated')}: ${dateTime()}`, 16, 46)

  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.text(`${t('reportPeriod')}: ${period}`, 16, 56)
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('reportAthlete').toUpperCase(), 16, 68)

  const athlete = [
    [t('athlete'), initials(profile.name)],
    [t('height'), profile.height || t('reportEmpty')],
    [t('weightCat'), profile.weight || t('reportEmpty')],
    [t('born'), profile.dob || t('reportEmpty')],
  ]
  autoTable(doc, {
    startY: 72,
    body: athlete,
    theme: 'plain',
    styles: { font: 'DejaVu', fontSize: 8, cellPadding: 2, textColor: dark },
    columnStyles: { 0: { textColor: muted, cellWidth: 42 }, 1: { fontStyle: 'bold' } },
    margin: { left: 16, right: 16 },
  })

  const tableStart = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('trainingDiary').toUpperCase(), 16, tableStart + 12)
  autoTable(doc, {
    startY: tableStart + 16,
    head: [[t('reportDate'), t('reportExercises'), t('reportFocus'), t('reportNotes')]],
    body: entries.map((entry) => [entry.date, formatWork(entry), entry.focus || t('reportEmpty'), entry.notes || t('reportEmpty')]),
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 7.2, cellPadding: 2.3, textColor: dark, valign: 'top', lineColor: [215, 203, 187] },
    headStyles: { fillColor: dark, textColor: [255, 255, 255], font: 'DejaVu', fontStyle: 'normal' },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 58 }, 2: { cellWidth: 48 }, 3: { cellWidth: 50 } },
    margin: { left: 16, right: 16, bottom: 16 },
    didDrawPage: () => {
      doc.setFont('DejaVu')
      doc.setTextColor(...muted)
      doc.setFontSize(7)
      doc.text('MyJudoStat · Rys Judo Club', 16, 291)
    },
  })

  let summaryStart = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStart + 30) + 12
  if (summaryStart > 270) {
    doc.addPage()
    summaryStart = 18
  }
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('exerciseStats').toUpperCase(), 16, summaryStart)
  autoTable(doc, {
    startY: summaryStart + 4,
    head: [[t('categoryName'), t('totalVolume'), t('bestSet'), t('bestWorkout')]],
    body: workSummary(entries).map((item) => [item.name, item.total, item.bestSet, item.bestWorkout]),
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 7.4, cellPadding: 2.3, textColor: dark, lineColor: [215, 203, 187] },
    headStyles: { fillColor: dark, textColor: [255, 255, 255], font: 'DejaVu', fontStyle: 'normal' },
    margin: { left: 16, right: 16 },
    didDrawPage: () => {
      doc.setFont('DejaVu')
      doc.setTextColor(...muted)
      doc.setFontSize(7)
      doc.text('MyJudoStat · Rys Judo Club', 16, 291)
    },
  })

  return new File([doc.output('blob')], fileName, { type: 'application/pdf' })
}
