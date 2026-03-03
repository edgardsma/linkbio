import { prisma } from '../lib/prisma.js'

async function main() {
  console.log('🎨 Criando usuário de teste com cores personalizadas...')

  // Criar usuário com cores personalizadas
  const user = await prisma.user.upsert({
    where: { email: 'teste.cores@example.com' },
    update: {},
    create: {
      email: 'teste.cores@example.com',
      username: 'testecores',
      name: 'Usuário Teste Cores',
      bio: 'Este é um usuário para testar cores dinâmicas do tema',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // senha_hash
      // Cores personalizadas
      primaryColor: '#ff6b6b',
      secondaryColor: '#feca57',
      backgroundColor: '#2d3436',
      textColor: '#ffffff',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testecores',
    },
  })

  console.log('✅ Usuário criado/atualizado:', {
    username: user.username,
    primaryColor: user.primaryColor,
    secondaryColor: user.secondaryColor,
    backgroundColor: user.backgroundColor,
    textColor: user.textColor,
  })

  // Criar alguns links para testar
  const links = await prisma.link.createMany({
    data: [
      {
        title: 'Instagram',
        url: 'https://instagram.com',
        description: 'Meu perfil no Instagram',
        icon: '📸',
        position: 1,
        userId: user.id,
        isActive: true,
      },
      {
        title: 'YouTube',
        url: 'https://youtube.com',
        description: 'Canal no YouTube',
        icon: '🎬',
        position: 2,
        userId: user.id,
        isActive: true,
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com',
        description: 'Perfil no Twitter',
        icon: '🐦',
        position: 3,
        userId: user.id,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ ${links.count} links criados para teste`)

  console.log('\n📝 URL para testar: http://localhost:3000/testecores')
  console.log('🎨 Cores aplicadas:')
  console.log(`   - Fundo: ${user.backgroundColor}`)
  console.log(`   - Gradiente links: ${user.primaryColor} → ${user.secondaryColor}`)
  console.log(`   - Texto: ${user.textColor}`)
  console.log(`   - Borda avatar: ${user.primaryColor}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
