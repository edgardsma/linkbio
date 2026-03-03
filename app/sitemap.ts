import prisma from '@/lib/prisma'

export async function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Buscar todos os usuários que possuem links ativos
  const users = await prisma.user.findMany({
    where: {
      links: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      username: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Criar entradas do sitemap
  const urls = users.map((user) => ({
    url: `${baseUrl}/${user.username}`,
    lastModified: user.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Adicionar página inicial
  urls.unshift({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  })

  return urls
}
