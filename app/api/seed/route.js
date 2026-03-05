import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma.js'

const themes = [
  // Temas Gratuitos (5)
  {
    name: 'default',
    isPremium: false,
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    description: 'Tema padrão roxo',
  },
  {
    name: 'ocean',
    isPremium: false,
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    backgroundColor: '#f0f9ff',
    textColor: '#0c4a6e',
    description: 'Tema oceano azul',
  },
  {
    name: 'forest',
    isPremium: false,
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    description: 'Tema floresta verde',
  },
  {
    name: 'sunset',
    isPremium: false,
    primaryColor: '#f97316',
    secondaryColor: '#c2410c',
    backgroundColor: '#fff7ed',
    textColor: '#7c2d12',
    description: 'Tema pôr do sol laranja',
  },
  {
    name: 'midnight',
    isPremium: false,
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    backgroundColor: '#1e1b4b',
    textColor: '#e0e7ff',
    description: 'Tema meia-noite escuro',
  },

  // Temas Premium (15)
  {
    name: 'aurora',
    isPremium: true,
    primaryColor: '#ec4899',
    secondaryColor: '#be185d',
    backgroundColor: '#fdf2f8',
    textColor: '#831843',
    description: 'Tema aurora rosa vibrante',
  },
  {
    name: 'cyberpunk',
    isPremium: true,
    primaryColor: '#00ff88',
    secondaryColor: '#00cc6a',
    backgroundColor: '#0a0a0a',
    textColor: '#00ff88',
    description: 'Tema cyberpunk neon',
  },
  {
    name: 'gold',
    isPremium: true,
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    backgroundColor: '#fffbeb',
    textColor: '#78350f',
    description: 'Tema ouro elegante',
  },
  {
    name: 'lavender',
    isPremium: true,
    primaryColor: '#a78bfa',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
    textColor: '#5b21b6',
    description: 'Tema lavanda suave',
  },
  {
    name: 'emerald',
    isPremium: true,
    primaryColor: '#059669',
    secondaryColor: '#047857',
    backgroundColor: '#ecfdf5',
    textColor: '#064e3b',
    description: 'Tema esmeralda luxuoso',
  },
  {
    name: 'ruby',
    isPremium: true,
    primaryColor: '#e11d48',
    secondaryColor: '#9f1239',
    backgroundColor: '#fef2f2',
    textColor: '#7f1d1d',
    description: 'Tema rubi intenso',
  },
  {
    name: 'slate',
    isPremium: true,
    primaryColor: '#475569',
    secondaryColor: '#334155',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    description: 'Tema ardósia profissional',
  },
  {
    name: 'rose',
    isPremium: true,
    primaryColor: '#f43f5e',
    secondaryColor: '#e11d48',
    backgroundColor: '#fff1f2',
    textColor: '#881337',
    description: 'Tema rosa romântico',
  },
  {
    name: 'indigo',
    isPremium: true,
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    backgroundColor: '#eef2ff',
    textColor: '#312e81',
    description: 'Tema índigo profundo',
  },
  {
    name: 'teal',
    isPremium: true,
    primaryColor: '#14b8a6',
    secondaryColor: '#0f766e',
    backgroundColor: '#f0fdfa',
    textColor: '#134e4a',
    description: 'Tema teal refrescante',
  },
  {
    name: 'amber',
    isPremium: true,
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    backgroundColor: '#fffbeb',
    textColor: '#78350f',
    description: 'Tema âmbar acolhedor',
  },
  {
    name: 'crimson',
    isPremium: true,
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    backgroundColor: '#fef2f2',
    textColor: '#7f1d1d',
    description: 'Tema carmesim vibrante',
  },
  {
    name: 'violet',
    isPremium: true,
    primaryColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
    textColor: '#4c1d95',
    description: 'Tema violeta místico',
  },
  {
    name: 'copper',
    isPremium: true,
    primaryColor: '#b45309',
    secondaryColor: '#92400e',
    backgroundColor: '#fffbeb',
    textColor: '#78350f',
    description: 'Tema cobre metálico',
  },
]

export async function POST() {
  try {
    let created = 0
    let skipped = 0

    for (const theme of themes) {
      const existing = await prisma.theme.findUnique({
        where: { name: theme.name },
      })

      if (!existing) {
        await prisma.theme.create({
          data: theme,
        })
        created++
      } else {
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Temas inseridos com sucesso',
      created,
      skipped,
      total: themes.length,
    })
  } catch (error) {
    console.error('Erro ao inserir temas:', error)
    return NextResponse.json(
      { error: 'Erro ao inserir temas' },
      { status: 500 }
    )
  }
}
