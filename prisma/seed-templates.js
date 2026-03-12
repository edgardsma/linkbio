/**
 * Seed dos 10 templates visuais por categoria
 * Uso: node prisma/seed-templates.js
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const templates = [
  {
    name: 'Fashion',
    category: 'Fashion',
    isPremium: false,
    primaryColor: '#E91E8C',
    secondaryColor: '#FF6B9D',
    backgroundColor: '#FFF0F7',
    textColor: '#1A0A10',
    buttonStyle: 'rounded',
    fontFamily: 'playfair',
    description: 'Elegante e sofisticado para moda e estilo de vida',
  },
  {
    name: 'Fitness',
    category: 'Fitness',
    isPremium: false,
    primaryColor: '#FF6B35',
    secondaryColor: '#F7C59F',
    backgroundColor: '#1A1A2E',
    textColor: '#FFFFFF',
    buttonStyle: 'square',
    fontFamily: 'oswald',
    description: 'Energético e motivador para fitness e saúde',
  },
  {
    name: 'Música',
    category: 'Música',
    isPremium: false,
    primaryColor: '#7C3AED',
    secondaryColor: '#00D9FF',
    backgroundColor: '#0F0F1A',
    textColor: '#FFFFFF',
    buttonStyle: 'rounded',
    fontFamily: 'poppins',
    description: 'Vibrante e criativo para artistas e músicos',
  },
  {
    name: 'Negócios',
    category: 'Negócios',
    isPremium: false,
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    buttonStyle: 'square',
    fontFamily: 'montserrat',
    description: 'Profissional e confiável para negócios e carreira',
  },
  {
    name: 'Criador',
    category: 'Criador',
    isPremium: false,
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    backgroundColor: '#FFFBEB',
    textColor: '#1C1917',
    buttonStyle: 'rounded',
    fontFamily: 'poppins',
    description: 'Criativo e autêntico para criadores de conteúdo',
  },
  {
    name: 'Marketing',
    category: 'Marketing',
    isPremium: true,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    backgroundColor: '#FAFAFA',
    textColor: '#1F2937',
    buttonStyle: 'outline',
    fontFamily: 'inter',
    description: 'Moderno e persuasivo para marketing e vendas',
  },
  {
    name: 'Sports',
    category: 'Sports',
    isPremium: false,
    primaryColor: '#DC2626',
    secondaryColor: '#FBBF24',
    backgroundColor: '#111827',
    textColor: '#FFFFFF',
    buttonStyle: 'square',
    fontFamily: 'oswald',
    description: 'Ousado e dinâmico para atletas e esportes',
  },
  {
    name: 'Social Media',
    category: 'Social Media',
    isPremium: false,
    primaryColor: '#E1306C',
    secondaryColor: '#833AB4',
    backgroundColor: '#FAFAFA',
    textColor: '#262626',
    buttonStyle: 'rounded',
    fontFamily: 'poppins',
    description: 'Colorido e engajante para influenciadores',
  },
  {
    name: 'Telegram',
    category: 'Telegram',
    isPremium: false,
    primaryColor: '#0088CC',
    secondaryColor: '#54A9EB',
    backgroundColor: '#FFFFFF',
    textColor: '#1C1E21',
    buttonStyle: 'rounded',
    fontFamily: 'inter',
    description: 'Limpo e direto para canais do Telegram',
  },
  {
    name: 'WhatsApp',
    category: 'WhatsApp',
    isPremium: false,
    primaryColor: '#25D366',
    secondaryColor: '#128C7E',
    backgroundColor: '#ECE5DD',
    textColor: '#111B21',
    buttonStyle: 'rounded',
    fontFamily: 'inter',
    description: 'Familiar e acolhedor para grupos do WhatsApp',
  },
]

async function main() {
  console.log('Criando templates...')
  for (const template of templates) {
    await prisma.theme.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    })
    console.log(`✓ ${template.name}`)
  }
  console.log(`\n${templates.length} templates criados com sucesso!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
