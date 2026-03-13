'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const PLAN_COLORS = {
  STARTER: '#7c3aed',
  PRO:     '#2563eb',
  PREMIUM: '#ea580c',
}

export default function AdminDashboardCharts({ dayLabels, dayCounts, activeSubs }) {
  // Build doughnut data from activeSubs
  const planCounts = {}
  for (const s of activeSubs) {
    const plan = s.plan || 'FREE'
    planCounts[plan] = (planCounts[plan] || 0) + 1
  }
  const planLabels = Object.keys(planCounts)
  const planData   = Object.values(planCounts)
  const planBgColors = planLabels.map(
    (p) => PLAN_COLORS[p] || '#94a3b8'
  )

  const lineData = {
    labels: dayLabels,
    datasets: [
      {
        label: 'Novos usuários',
        data: dayCounts,
        fill: true,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderColor: '#7c3aed',
        borderWidth: 2,
        pointBackgroundColor: '#7c3aed',
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 12 }, precision: 0 },
      },
    },
  }

  const doughnutData = {
    labels: planLabels.length > 0 ? planLabels : ['Sem assinaturas'],
    datasets: [
      {
        data: planData.length > 0 ? planData : [1],
        backgroundColor: planData.length > 0 ? planBgColors : ['#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#475569', font: { size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
        cornerRadius: 8,
      },
    },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Line chart */}
      <div className="chart-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0' }}>
          <h2 className="admin-card-title">Novos usuários (7 dias)</h2>
        </div>
        <div className="chart-wrapper">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Doughnut chart */}
      <div className="chart-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0' }}>
          <h2 className="admin-card-title">Assinaturas por Plano</h2>
        </div>
        <div className="chart-wrapper">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  )
}
