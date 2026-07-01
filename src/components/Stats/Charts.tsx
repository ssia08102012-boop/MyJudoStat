import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js'
import { t } from '@/services/i18n'
import { calcStats } from '@/services/storage'
import type { Tournament } from '@/types'
import styles from './Charts.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const FONT = "'Crimson Pro', Georgia, serif"
const MUTED = '#52606e'
const GRID  = 'rgba(26,40,56,.8)'

interface Props {
  comps: Tournament[]
  activeYear: number | 'all'
}

export default function Charts({ comps, activeYear }: Props) {
  const source = activeYear === 'all' ? comps : comps.filter((c) => c.year === activeYear)
  const years = [...new Set(source.map((c) => c.year))].sort()

  const winsByYear  = years.map((y) => source.filter((c) => c.year === y).reduce((s, c) => s + c.fights.filter((f) => f.r === 'w').length, 0))
  const lossByYear  = years.map((y) => source.filter((c) => c.year === y).reduce((s, c) => s + c.fights.filter((f) => f.r === 'l').length, 0))

  const overall = calcStats(source)
  const hasData = overall.fights > 0

  if (!hasData) return null

  const barData = {
    labels: years.map(String),
    datasets: [
      {
        label: t('wins'),
        data: winsByYear,
        backgroundColor: 'rgba(61,186,112,.75)',
        borderRadius: 6,
      },
      {
        label: t('losses'),
        data: lossByYear,
        backgroundColor: 'rgba(224,68,68,.75)',
        borderRadius: 6,
      },
    ],
  }

  const donutData = {
    labels: [t('gold'), t('silver'), t('bronze')],
    datasets: [{
      data: [overall.gold, overall.silver, overall.bronze],
      backgroundColor: ['rgba(245,192,64,.85)', 'rgba(180,180,200,.7)', 'rgba(180,120,60,.8)'],
      borderWidth: 0,
    }],
  }

  const baseOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: MUTED, font: { family: FONT, size: 12 } },
      },
      tooltip: {
        titleFont: { family: FONT },
        bodyFont: { family: FONT },
      },
    },
  }

  const barOptions = {
    ...baseOptions,
    scales: {
      x: { ticks: { color: MUTED }, grid: { color: GRID } },
      y: { ticks: { color: MUTED, stepSize: 1 }, grid: { color: GRID }, beginAtZero: true },
    },
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>{t('chartFightsByYear')}</div>
        <Bar data={barData} options={barOptions} />
      </div>
      {(overall.gold + overall.silver + overall.bronze) > 0 && (
        <div className={`${styles.card} ${styles.donutCard}`}>
          <div className={styles.title}>{t('chartMedals')}</div>
          <Doughnut data={donutData} options={{ ...baseOptions, cutout: '65%' }} />
        </div>
      )}
    </div>
  )
}
