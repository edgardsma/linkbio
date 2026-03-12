/**
 * Email - Sistema de envio de emails usando Resend
 *
 * Para obter API Key: https://resend.com/api-keys
 */

import { Resend } from 'resend'

// Inicializa o cliente Resend se API key estiver configurada
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(params) {
  const { name, email, username } = params

  if (!resend) {
    console.warn('Resend não configurado - email não enviado')
    return { success: false, error: 'Email não configurado' }
  }

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const profileUrl = `${appUrl}/${username}`

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM || 'LinkBio Brasil <noreply@linkbio.com.br>',
      to: [email],
      subject: `Bem-vindo ao LinkBio Brasil, ${name}! 🚀`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao LinkBio Brasil</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .header p { color: rgba(255,255,255,0.9); font-size: 18px; }
    .content { background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .features { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { display: flex; align-items: center; gap: 10px; margin: 12px 0; }
    .feature-icon { font-size: 24px; }
    .feature-text { font-size: 14px; color: #374151; }
    .cta { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .cta:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .profile-link { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #bae6fd; }
    .profile-url { color: #0369a1; font-weight: bold; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">LinkBio Brasil</div>
      <p>Sua página de links personalizada! 🚀</p>
    </div>
    <div class="content">
      <p>Olá, <strong>${name}</strong>!</p>
      <p>Seja muito bem-vindo(a) ao <strong>LinkBio Brasil</strong>! 🎉</p>
      <p>Você agora tem sua própria página de links para compartilhar nas redes sociais. Sua página já está ativa e pronta para uso.</p>

      <div class="profile-link">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Sua página pública:</p>
        <a href="${profileUrl}" class="profile-url">${profileUrl}</a>
      </div>

      <h3 style="color: #667eea; margin-top: 24px;">🌟 Top 3 Funcionalidades</h3>
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🔗</span>
          <span class="feature-text">Links ilimitados para todas as suas redes sociais</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🎨</span>
          <span class="feature-text">Templates visuais profissionais para personalizar sua página</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📊</span>
          <span class="feature-text">Analytics detalhados para acompanhar seus cliques</span>
        </div>
      </div>

      <h3 style="color: #667eea; margin-top: 24px;">🎯 Próximos Passos</h3>
      <p style="margin-bottom: 16px;">Para maximizar sua página, recomendamos:</p>
      <ol style="margin-left: 20px; line-height: 2;">
        <li>Adicionar sua foto de perfil</li>
        <li>Criar seus primeiros links (Instagram, WhatsApp, etc.)</li>
        <li>Escolher um template visual que combine com você</li>
        <li>Compartilhar seu link nas redes sociais</li>
      </ol>

      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" class="cta">Acessar Dashboard</a>
      </div>

      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        Se precisar de ajuda, estamos aqui para você!
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${profileUrl}" style="color: #667eea; text-decoration: none; font-weight: bold;">
          Ver minha página →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Você recebeu este email porque se cadastrou no LinkBio Brasil.</p>
      <p style="margin-top: 8px;">
        <a href="${appUrl}" style="color: #667eea;">linkbio.com.br</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function sendPasswordResetEmail(params) {
  const { name, email, token } = params

  if (!resend) {
    console.warn('Resend não configurado - email não enviado')
    return { success: false, error: 'Email não configurado' }
  }

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM || 'LinkBio Brasil <noreply@linkbio.com.br>',
      to: [email],
      subject: 'Redefinir sua senha - LinkBio Brasil',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .logo { color: white; font-size: 24px; font-weight: bold; }
    .content { background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">LinkBio Brasil</div>
    </div>
    <div class="content">
      <p>Olá, <strong>${name}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>

      <a href="${resetUrl}" class="button">Redefinir Senha</a>

      <div class="warning">
        <p style="margin: 0;"><strong>⚠️ Este link é válido por 1 hora.</strong></p>
        <p style="margin: 8px 0 0 0;">Se você não solicitou esta redefinição, ignore este email.</p>
      </div>

      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        Se precisar de ajuda, entre em contato conosco.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 LinkBio Brasil. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verifica se o sistema de email está configurado
 */
export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM
}
