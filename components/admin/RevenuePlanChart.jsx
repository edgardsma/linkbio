'use client'

import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const PLAN_COLORS = {
  STARTER: '#7c3aed',
  PRO:     '#2563eb',
  PREMIUM: '#ea580c',
}

const PLAN_PRICES = { STARTER: 19.9, PRO: 39.9, PREMIUM: 79.9 }

export default function RevenuePlanChart({ activeSubs, monthLabels, monthCounts }) {
  // Build pie data from activeSubs
  const planRevenue = {}
  for (const s of activeSubs) {
    const plan = s.plan
    if (PLAN_PRICES[plan]) {
      planRevenue[plan] = (planRevenue[plan] || 0) + PLAN_PRICES[plan]
    }
  }

  const pieLabels = Object.keys(planRevenue)
  const pieData   = Object.values(planRevenue)
  const pieBgColors = pieLabels.map((p) => PLAN_COLORS[p] || '#94a3b8')

  const pieChartData = {
    labels: pieLabels.length > 0 ? pieLabels : ['Sem receita'],
    datasets: [
      {
        data: pieData.length > 0 ? pieData : [1],
        backgroundColor: pieData.length > 0 ? pieBgColors : ['#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#475569', font: { size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        backgroundColor: '#0f172a',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
        cornerRadius: 8,
      },
    },
  }

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Novas assinaturas',
        data: monthCounts,
        backgroundColor: '#7c3aed',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const barOptions = {
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="chart-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0' }}>
          <h2 className="admin-card-title">Receita por Plano</h2>
        </div>
        <div className="chart-wrapper">
          <Pie data={pieChartData} options={pieOptions} />
        </div>
      </div>

      <div className="chart-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0' }}>
          <h2 className="admin-card-title">Novas Assinaturas (6 meses)</h2>
        </div>
        <div className="chart-wrapper">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  )
}
