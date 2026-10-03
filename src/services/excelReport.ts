import ExcelJS from 'exceljs'
import logoUrl from '@/assets/logo-rys.png'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Profile, Tournament, TrainingEntry, TrainingMetric } from '@/types'

const DARK = '1C232A'
const ORANGE = 'C35A00'
const MUTED = '66717C'
const LIGHT = 'F7F3EE'

async function logoDataUrl(): Promise<string> {
  const response = await fetch(logoUrl)
  const blob = await response.blob()
  return `data:${blob.type};base64,${await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob) })}`
}

function entryMetrics(entry: TrainingEntry): TrainingMetric[] {
  if (entry.metrics?.length) return entry.metrics.filter((metric) => metric.name.trim())
  const legacy: Array<[keyof TrainingEntry, string]> = [['throws', t('throws')], ['techniques', t('techniques')], ['fights', t('trainingFights')], ['pullUps', t('pullUps')], ['abs', t('abs')], ['bands', t('bands')]]
  return legacy.map(([key, name]) => ({ id: `legacy-${key}`, name, value: Number(entry[key]) || 0 })).filter((metric) => metric.value > 0)
}

function formatWork(entry: TrainingEntry): string {
  const metrics = entryMetrics(entry)
  return metrics.length ? metrics.map((metric) => `${metric.name}: ${metric.value}${metric.sets && metric.sets.length > 1 ? ` (${metric.sets.join(' + ')})` : ''}`).join('; ') : t('reportEmpty')
}

function setTitle(sheet: ExcelJS.Worksheet, title: string, imageId: number) {
  sheet.mergeCells('A1:D1')
  sheet.mergeCells('A2:D2')
  sheet.getCell('A1').value = 'MY JUDO STAT'
  sheet.getCell('A2').value = title.toUpperCase()
  ;['A1', 'A2'].forEach((cell) => {
    sheet.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } }
    sheet.getCell(cell).font = { name: 'Arial', bold: true, color: { argb: cell === 'A1' ? 'FFFFFFFF' : `FF${ORANGE}` }, size: cell === 'A1' ? 15 : 10 }
    sheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'left', indent: 5 }
  })
  sheet.getRow(1).height = 25
  sheet.getRow(2).height = 18
  sheet.addImage(imageId, { tl: { col: 0.3, row: 0.2 }, ext: { width: 36, height: 36 } })
  sheet.getCell('A4').value = `${t('reportGenerated')}: ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
  sheet.getCell('A4').font = { name: 'Arial', size: 9, color: { argb: `FF${MUTED}` } }
}

function setPeriod(sheet: ExcelJS.Worksheet, period: string) {
  sheet.getCell('A5').value = `${t('reportPeriod')}: ${period}`
  sheet.getCell('A5').font = { name: 'Arial', bold: true, size: 9, color: { argb: `FF${DARK}` } }
}

function addProfile(sheet: ExcelJS.Worksheet, profile: Profile, startRow: number): number {
  sheet.getCell(`A${startRow}`).value = t('reportAthlete').toUpperCase()
  sheet.getCell(`A${startRow}`).font = { name: 'Arial', bold: true, color: { argb: `FF${ORANGE}` }, size: 10 }
  const rows = [[t('athlete'), profile.name?.trim() || t('reportEmpty')], [t('height'), profile.height || t('reportEmpty')], [t('weightCat'), profile.weight || t('reportEmpty')], [t('born'), profile.dob || t('reportEmpty')]]
  rows.forEach(([label, value], index) => {
    const row = startRow + 1 + index
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`B${row}`).value = value
    sheet.getCell(`A${row}`).font = { name: 'Arial', color: { argb: `FF${MUTED}` }, size: 9 }
    sheet.getCell(`B${row}`).font = { name: 'Arial', bold: true, size: 9 }
  })
  return startRow + rows.length + 2
}

function styleTable(sheet: ExcelJS.Worksheet, headerRow: number, endRow: number, columns: number) {
  for (let column = 1; column <= columns; column++) {
    const cell = sheet.getRow(headerRow).getCell(column)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } }
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.alignment = { vertical: 'middle', wrapText: true }
  }
  for (let row = headerRow + 1; row <= endRow; row++) {
    for (let column = 1; column <= columns; column++) {
      const cell = sheet.getRow(row).getCell(column)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row % 2 ? `FF${LIGHT}` : 'FFFFFFFF' } }
      cell.font = { name: 'Arial', size: 9 }
      cell.alignment = { vertical: 'top', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0D6C8' } } }
    }
  }
}

async function exportWorkbook(workbook: ExcelJS.Workbook, name: string): Promise<File> {
  const buffer = await workbook.xlsx.writeBuffer()
  return new File([buffer], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function createDiaryExcel(entries: TrainingEntry[], profile: Profile, from: string, to: string): Promise<File> {
  const workbook = new ExcelJS.Workbook()
  const logo = workbook.addImage({ base64: await logoDataUrl(), extension: 'png' })
  const diary = workbook.addWorksheet(t('trainingDiary').slice(0, 31))
  setTitle(diary, t('reportDiaryTitle'), logo)
  setPeriod(diary, `${from} - ${to}`)
  const start = addProfile(diary, profile, 6)
  diary.getRow(start).values = [t('reportDate'), t('reportExercises'), t('reportFocus'), t('reportNotes')]
  entries.forEach((entry) => diary.addRow([entry.date, formatWork(entry), entry.focus || t('reportEmpty'), entry.notes || t('reportEmpty')]))
  styleTable(diary, start, start + entries.length, 4)
  diary.columns = [{ width: 15 }, { width: 48 }, { width: 30 }, { width: 40 }]
  diary.views = [{ state: 'frozen', ySplit: start }]

  const summary = workbook.addWorksheet(t('exerciseStats').slice(0, 31))
  setTitle(summary, t('exerciseStats'), logo)
  setPeriod(summary, `${from} - ${to}`)
  summary.getRow(6).values = [t('categoryName'), t('totalVolume'), t('bestSet'), t('bestWorkout')]
  const byExercise = new Map<string, { name: string, total: number, bestSet: number, bestWorkout: number }>()
  entries.forEach((entry) => {
    const totals = new Map<string, number>()
    entryMetrics(entry).forEach((metric) => {
      const key = metric.name.trim().toLocaleLowerCase()
      const item = byExercise.get(key) ?? { name: metric.name.trim(), total: 0, bestSet: 0, bestWorkout: 0 }
      item.total += metric.value
      item.bestSet = Math.max(item.bestSet, metric.bestSet ?? Math.max(...(metric.sets ?? [metric.value]), 0))
      byExercise.set(key, item)
      totals.set(key, (totals.get(key) ?? 0) + metric.value)
    })
    totals.forEach((total, key) => { const item = byExercise.get(key); if (item) item.bestWorkout = Math.max(item.bestWorkout, total) })
  })
  ;[...byExercise.values()].sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => summary.addRow([item.name, item.total, item.bestSet, item.bestWorkout]))
  styleTable(summary, 6, 5 + byExercise.size, 4)
  summary.columns = [{ width: 30 }, { width: 20 }, { width: 20 }, { width: 24 }]

  return exportWorkbook(workbook, `MyJudoStat-${from}-${to}.xlsx`)
}

export async function createTournamentExcel(comps: Tournament[], profile: Profile, year: number | 'all'): Promise<File> {
  const workbook = new ExcelJS.Workbook()
  const logo = workbook.addImage({ base64: await logoDataUrl(), extension: 'png' })
  const sheet = workbook.addWorksheet(t('competitions').slice(0, 31))
  const period = year === 'all' ? t('reportAllYears') : String(year)
  setTitle(sheet, t('reportTournamentsTitle'), logo)
  setPeriod(sheet, period)
  const start = addProfile(sheet, profile, 6)
  const stats = calcStats(comps)
  sheet.getCell(`A${start}`).value = t('statistics').toUpperCase()
  sheet.getCell(`A${start}`).font = { name: 'Arial', bold: true, color: { argb: `FF${ORANGE}` }, size: 10 }
  sheet.getRow(start + 1).values = [t('reportTournaments'), t('fights'), t('reportWins'), t('reportLosses'), t('reportMedals')]
  sheet.getRow(start + 2).values = [stats.tournaments, stats.fights, stats.wins, stats.losses, stats.gold + stats.silver + stats.bronze]
  styleTable(sheet, start + 1, start + 2, 5)
  const tableRow = start + 5
  sheet.getRow(tableRow).values = [t('reportDate'), t('reportTournamentName'), t('reportLocation'), t('reportCategory'), t('weightCat'), t('reportPlace'), t('reportResult')]
  comps.slice().sort((a, b) => b.date.localeCompare(a.date)).forEach((comp) => {
    const wins = comp.fights.filter((fight) => fight.r === 'w').length
    sheet.addRow([comp.date, comp.name, comp.location || t('reportEmpty'), comp.ageCategory || t('reportEmpty'), comp.weightCategory || t('reportEmpty'), comp.place ?? t('reportEmpty'), `${wins} / ${comp.fights.length - wins}`])
  })
  styleTable(sheet, tableRow, tableRow + comps.length, 7)
  sheet.columns = [{ width: 15 }, { width: 38 }, { width: 24 }, { width: 18 }, { width: 16 }, { width: 12 }, { width: 12 }]
  sheet.views = [{ state: 'frozen', ySplit: tableRow }]

  return exportWorkbook(workbook, `MyJudoStat-tournaments-${year === 'all' ? 'all' : year}.xlsx`)
}
