import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 Criando temas pré-definidos...')

  const themes = [
    // Temas FREE
    {
      name: 'Clássico',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
      isPremium: false,
      description: 'Um tema clássico e elegante'
    },
    {
      name: 'Oceano',
      primaryColor: '#0077b6',
      secondaryColor: '#0056b3',
      backgroundColor: '#f0f9ff',
      textColor: '#0f172a',
      isPremium: false,
      description: 'Tema inspirado nas profundezas do oceano'
    },
    {
      name: 'Floresta',
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      backgroundColor: '#ecfdf5',
      textColor: '#064e3b',
      isPremium: false,
      description: 'Cores naturais da floresta'
    },
    {
      name: 'Sunset',
      primaryColor: '#f97316',
      secondaryColor: '#fb923c',
      backgroundColor: '#fff7ed',
      textColor: '#4c0519',
      isPremium: false,
      description: 'A beleza de um pôr do sol'
    },
    {
      name: 'Grafite',
      primaryColor: '#64748b',
      secondaryColor: '#9ca3af',
      backgroundColor: '#f3f4f6',
      textColor: '#1e1b4b',
      isPremium: false,
      description: 'Tema moderno e criativo'
    },

    // Temas PREMIUM
    {
      name: 'Aurora Boreal',
      primaryColor: '#8b5cf6',
      secondaryColor: '#a78bfa',
      backgroundColor: '#1e1b2e',
      textColor: '#e9d5ff',
      isPremium: true,
      description: 'As cores mágicas da aurora boreal'
    },
    {
      name: 'Cosmos',
      primaryColor: '#4f46e5',
      secondaryColor: '#7c3aed',
      backgroundColor: '#1e1b2e',
      textColor: '#e9d5ff',
      isPremium: true,
      description: 'Explore as profundezas do universo'
    },
    {
      name: 'Cristal',
      primaryColor: '#06b6d4',
      secondaryColor: '#3b82f6',
      backgroundColor: '#1e1b2e',
      textColor: '#ffffff',
      isPremium: true,
      description: 'Elegância em forma de cristal'
    },
    {
      name: 'Néon',
      primaryColor: '#f43f5e',
      secondaryColor: '#ec4899',
      backgroundColor: '#1e1b2e',
      textColor: '#e9d5ff',
      isPremium: true,
      description: 'Cores vibrantes que impressionam'
    },
    {
      name: 'Diamante',
      primaryColor: '#fbbf24',
      secondaryColor: '#f59e0b',
      backgroundColor: '#1e1b2e',
      textColor: '#fef3c7',
      isPremium: true,
      description: 'Luxo e sofisticação para sua página'
    },
  ]

  for (const theme of themes) {
    try {
      const existingTheme = await prisma.theme.findUnique({
        where: { name: theme.name }
      })

      if (!existingTheme) {
        await prisma.theme.create({
          data: theme
        })
        console.log(`✅ Tema "${theme.name}" criado${theme.isPremium ? ' (PREMIUM)' : ''}`)
      } else {
        console.log(`⏭ Tema "${theme.name}" já existe`)
      }
    } catch (error) {
      console.error(`❌ Erro ao criar tema "${theme.name}":`, error)
    }
  }

  console.log(`\n🎨 ${themes.filter(t => !t.isPremium).length} temas FREE criados`)
  console.log(`🎨 ${themes.filter(t => t.isPremium).length} temas PREMIUM criados`)
  console.log(`🎨 Total: ${themes.length} temas criados`)
}

main()
  .catch((error) => {
    console.error('Erro ao criar temas:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
