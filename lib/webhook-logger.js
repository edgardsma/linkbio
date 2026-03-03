import prisma from '@/lib/prisma'

/**
 * Sistema de logging para webhooks do Stripe
 * Registra todos os eventos para auditoria e debugging
 */

/**
 * Cria um log de evento de webhook
 */
export async function logWebhookEvent(eventType, eventData, status = 'processed', error = null) {
  try {
    // TODO: Criar tabela WebhookLog no schema do Prisma
    // Por enquanto, usar console.log com estrutura

    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      status,
      error: error?.message,
      data: {
        id: eventData.id,
        objectId: eventData.object?.id,
        customerId: eventData.object?.customer,
        subscriptionId: eventData.object?.subscription,
      },
    }

    // Log formatado para fácil leitura
    console.log('[Webhook]', JSON.stringify(logEntry, null, 2))

    // Em produção, salvar no banco de dados
    if (process.env.NODE_ENV === 'production') {
      // await prisma.webhookLog.create({
      //   data: logEntry
      // })
    }

    return logEntry
  } catch (error) {
    console.error('[Webhook Logger] Erro ao criar log:', error)
  }
}

/**
 * Cria um log de sucesso
 */
export async function logWebhookSuccess(eventType, eventData) {
  return await logWebhookEvent(eventType, eventData, 'success')
}

/**
 * Cria um log de erro
 */
export async function logWebhookError(eventType, eventData, error) {
  return await logWebhookEvent(eventType, eventData, 'error', error)
}

/**
 * Cria um log de evento ignorado
 */
export async function logWebhookIgnored(eventType, reason) {
  console.log('[Webhook] Evento ignorado:', eventType, '-', reason)
}

/**
 * Busca logs recentes de webhooks
 */
export async function getRecentWebhookLogs(limit = 50) {
  // TODO: Implementar busca na tabela WebhookLog
  // const logs = await prisma.webhookLog.findMany({
  //   orderBy: { timestamp: 'desc' },
  //   take: limit,
  // })
  // return logs

  console.log('[Webhook Logger] TODO: Implementar busca de logs no banco')
  return []
}

/**
 * Busca logs por tipo de evento
 */
export async function getWebhookLogsByType(eventType, limit = 20) {
  // TODO: Implementar busca filtrada
  console.log(`[Webhook Logger] TODO: Implementar busca por tipo: ${eventType}`)
  return []
}

/**
 * Estatísticas de webhooks
 */
export async function getWebhookStats() {
  // TODO: Implementar estatísticas
  return {
    total: 0,
    success: 0,
    error: 0,
    byType: {},
  }
}

/**
 * Notifica administradores sobre erros críticos
 */
export async function notifyAdminsAboutError(error, eventData) {
  console.error('[Webhook] ERRO CRÍTICO:', error)
  console.error('[Webhook] Event data:', JSON.stringify(eventData, null, 2))

  // TODO: Implementar notificação real
  // - Email para admins
  // - Slack webhook
  // - PagerDuty, etc.

  if (process.env.ADMIN_EMAIL) {
    console.log(`[Webhook] Enviando email para admin: ${process.env.ADMIN_EMAIL}`)
    // await sendAdminEmail(error, eventData)
  }
}

/**
 * Verifica se evento deve ser reprocessado
 */
export async function shouldReprocessEvent(eventId, eventType) {
  // TODO: Verificar se evento já foi processado com sucesso
  // para evitar processamento duplicado

  // const existingLog = await prisma.webhookLog.findFirst({
  //   where: {
  //     eventType,
  //     'data.id': eventId,
  //     status: 'success'
  //   }
  // })

  // return !existingLog

  return true // Por enquanto, sempre processar
}
