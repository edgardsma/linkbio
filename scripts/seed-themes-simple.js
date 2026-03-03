const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const themes = [
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
    textColor: '#0f172a',
    description: 'Oceano profundo',
  },
  {
    name: 'forest',
    isPremium: false,
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    backgroundColor: '#ecfdf5',
    textColor: '#064e3b',
    description: 'Floresta verde',
  },
  {
    name: 'sunset',
    isPremium: false,
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    backgroundColor: '#fff7ed',
    textColor: '#7c2d12',
    description: 'Pôr do sol',
  },
  {
    name: 'midnight',
    isPremium: false,
    primaryColor: '#4f46e5',
    secondaryColor: '#3730a3',
    backgroundColor: '#111827',
    textColor: '#f9fafb',
    description: 'Noite escura',
  },
  {
    name: 'neon',
    isPremium: true,
    primaryColor: '#00ff9f',
    secondaryColor: '#00ff9f',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    description: 'Neon futurista',
  },
  {
    name: 'cyberpunk',
    isPremium: true,
    primaryColor: '#ff006e',
    secondaryColor: '#8338ec',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    description: 'Cyberpunk vibrante',
  },
  {
    name: 'aurora',
    isPremium: true,
    primaryColor: '#00ff87',
    secondaryColor: '#60efff',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    description: 'Aurora boreal',
  },
  {
    name: 'gradients',
    isPremium: true,
    primaryColor: '#7c3aed',
    secondaryColor: '#2563eb',
    backgroundColor: '#1e1b4b',
    textColor: '#e2e8f0',
    description: 'Gradientes vibrantes',
  },
  {
    name: 'gold',
    isPremium: true,
    primaryColor: '#ffd700',
    secondaryColor: '#ff8c00',
    backgroundColor: '#1a1a1a',
    textColor: '#ffd700',
    description: 'Dourado elegante',
  },
  {
    name: 'silver',
    isPremium: true,
    primaryColor: '#c0c0c0',
    secondaryColor: '#808080',
    backgroundColor: '#1a1a1a',
    textColor: '#e0e0e0',
    description: 'Prateado sofisticado',
  },
  {
    name: 'copper',
    isPremium: true,
    primaryColor: '#b87333',
    secondaryColor: '#cd7f32',
    backgroundColor: '#1a1a1a',
    textColor: '#deb887',
    description: 'Cobre terroso',
  },
  {
    name: 'rose',
    isPremium: true,
    primaryColor: '#e11d48',
    secondaryColor: '#be123c',
    backgroundColor: '#1a0a0a',
    textColor: '#fecdd3',
    description: 'Rosa romântico',
  },
  {
    name: 'lavender',
    isPremium: true,
    primaryColor: '#a855f7',
    secondaryColor: '#6366f1',
    backgroundColor: '#1e1b4b',
    textColor: '#e9d5ff',
    description: 'Lavanda relaxante',
  },
  {
    name: 'mint',
    isPremium: true,
    primaryColor: '#34d399',
    secondaryColor: '#059669',
    backgroundColor: '#0f2937',
    textColor: '#6ee7b7',
    description: 'Menta fresca',
  },
  {
    name: 'sky',
    isPremium: true,
    primaryColor: '#0ea5e9',
    secondaryColor: '#2563eb',
    backgroundColor: '#0f172a',
    textColor: '#7dd3fc',
    description: 'Céu azul',
  },
  {
    name: 'sunset-blend',
    isPremium: true,
    primaryColor: '#f59e0b',
    secondaryColor: '#ec4899',
    backgroundColor: '#1a0a0a',
    textColor: '#fbbf24',
    description: 'Blend de pôr',
  },
  {
    name: 'galaxy',
    isPremium: true,
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    backgroundColor: '#0f0a1a',
    textColor: '#c4b5fd',
    description: 'Galáxia espacial',
  },
  {
    name: 'rainbow',
    isPremium: true,
    primaryColor: '#ef4444',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    description: 'Arco-íris colorido',
  },
  {
    name: 'minimalist',
    isPremium: true,
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    description: 'Minimalista clean',
  },
  {
    name: 'bold',
    isPremium: true,
    primaryColor: '#dc2626',
    secondaryColor: '#fbbf24',
    backgroundColor: '#1a0a0a',
    textColor: '#fef08a',
    description: 'Negrito impactante',
  },
]

async function main() {
  try {
    console.log('🌱 Iniciando seed de temas...')

    // Verificar quantos temas já existem
    const existingThemes = await prisma.theme.count()
    console.log(`📊 Temas existentes: ${existingThemes}`)

    if (existingThemes > 0) {
      console.log('✅ Temas já foram seedados!')
      return
    }

    // Inserir temas
    const result = await prisma.theme.createMany({
      data: themes,
      skipDuplicates: true,
    })

    console.log(`✅ ${themes.length} temas criados com sucesso!`)
    console.log('📊 Resumo:')
    console.log(`   Temas gratuitos: ${themes.filter(t => !t.isPremium).length}`)
    console.log(`   Temas premium: ${themes.filter(t => t.isPremium).length}`)
  } catch (error) {
    console.error('❌ Erro ao fazer seed:')
    console.error(error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
