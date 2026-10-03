import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '@/assets/logo-rys.png'
import fontUrl from '@/assets/DejaVuSans.ttf?url'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Profile, Tournament } from '@/types'

function base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let output = ''
  for (let index = 0; index < bytes.length; index += 0x8000) output += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  return btoa(output)
}

async function assetDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return `data:${blob.type};base64,${base64(await blob.arrayBuffer())}`
}

function dateTime(): string {
  return new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function place(value: number | null): string {
  return value == null ? t('reportEmpty') : String(value)
}

export async function createTournamentReport(comps: Tournament[], profile: Profile, year: number | 'all'): Promise<File> {
  const [font, logo] = await Promise.all([assetDataUrl(fontUrl), assetDataUrl(logoUrl)])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('DejaVuSans.ttf', font.split(',')[1])
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
  doc.setFont('DejaVu')

  const orange: [number, number, number] = [195, 90, 0]
  const dark: [number, number, number] = [28, 35, 42]
  const muted: [number, number, number] = [95, 104, 112]
  const stats = calcStats(comps)
  const period = year === 'all' ? t('reportAllYears') : String(year)
  const fileName = `MyJudoStat-tournaments-${year === 'all' ? 'all' : year}.pdf`

  doc.setFillColor(...dark)
  doc.rect(0, 0, 210, 38, 'F')
  doc.addImage(logo, 'PNG', 16, 8, 22, 22)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('MY JUDO STAT', 44, 18)
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('reportTournamentsTitle').toUpperCase(), 44, 25)
  doc.setTextColor(...muted)
  doc.setFontSize(8)
  doc.text(`${t('reportGenerated')}: ${dateTime()}`, 16, 46)

  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.text(`${t('reportPeriod')}: ${period}`, 16, 56)
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('reportAthlete').toUpperCase(), 16, 68)

  autoTable(doc, {
    startY: 72,
    body: [[t('athlete'), profile.name?.trim() || t('reportEmpty')], [t('height'), profile.height || t('reportEmpty')], [t('weightCat'), profile.weight || t('reportEmpty')], [t('born'), profile.dob || t('reportEmpty')]],
    theme: 'plain',
    styles: { font: 'DejaVu', fontSize: 8, cellPadding: 2, textColor: dark },
    columnStyles: { 0: { textColor: muted, cellWidth: 42 }, 1: { fontStyle: 'bold' } },
    margin: { left: 16, right: 16 },
  })

  const athleteEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 98
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('statistics').toUpperCase(), 16, athleteEnd + 12)
  autoTable(doc, {
    startY: athleteEnd + 16,
    head: [[t('reportTournaments'), t('fights'), t('reportWins'), t('reportLosses'), t('reportMedals')]],
    body: [[stats.tournaments, stats.fights, stats.wins, stats.losses, stats.gold + stats.silver + stats.bronze]],
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 8, cellPadding: 3, halign: 'center', textColor: dark, lineColor: [215, 203, 187] },
    headStyles: { fillColor: dark, textColor: [255, 255, 255], font: 'DejaVu', fontStyle: 'normal' },
    margin: { left: 16, right: 16 },
  })

  const statsEnd = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? athleteEnd + 36
  doc.setTextColor(...orange)
  doc.setFontSize(10)
  doc.text(t('competitions').toUpperCase(), 16, statsEnd + 12)
  autoTable(doc, {
    startY: statsEnd + 16,
    head: [[t('reportDate'), t('reportTournamentName'), t('reportLocation'), t('reportCategory'), t('weightCat'), t('reportPlace'), t('reportResult')]],
    body: [...comps].sort((a, b) => b.date.localeCompare(a.date)).map((comp) => {
      const wins = comp.fights.filter((fight) => fight.r === 'w').length
      const losses = comp.fights.length - wins
      return [comp.date, comp.name, comp.location || t('reportEmpty'), comp.ageCategory || t('reportEmpty'), comp.weightCategory || t('reportEmpty'), place(comp.place), `${wins} / ${losses}`]
    }),
    theme: 'grid',
    styles: { font: 'DejaVu', fontSize: 6.7, cellPadding: 2, textColor: dark, valign: 'top', lineColor: [215, 203, 187] },
    headStyles: { fillColor: dark, textColor: [255, 255, 255], font: 'DejaVu', fontStyle: 'normal' },
    columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 42 }, 2: { cellWidth: 28 }, 3: { cellWidth: 22 }, 4: { cellWidth: 20 }, 5: { cellWidth: 14 }, 6: { cellWidth: 18 } },
    margin: { left: 16, right: 16, bottom: 16 },
    didDrawPage: () => {
      doc.setFont('DejaVu')
      doc.setTextColor(...muted)
      doc.setFontSize(7)
      doc.text('MyJudoStat · Rys Judo Club', 16, 291)
    },
  })

  return new File([doc.output('blob')], fileName, { type: 'application/pdf' })
}
