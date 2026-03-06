const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

(async () => {
  try {
    console.log('🔍 Testando conexão com Prisma...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Configurado' : '❌ Não configurado');

    // Testar query simples
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma conectado com sucesso!');
    console.log('Resultado da query:', result);

  } catch (error) {
    console.error('❌ Erro na conexão com Prisma:');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('📌 Conexão fechada');
  }
})();
