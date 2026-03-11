const { test, expect } = require('@playwright/test')

test.describe('Autenticação - Login', () => {
  test('deve exibir a página de login corretamente', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.getByRole('heading', { name: /Entrar na sua conta/i })).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible()
  })

  test('deve exibir erro ao tentar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByLabel(/Email/i).fill('invalido@teste.com')
    await page.getByLabel(/Senha/i).fill('SenhaErrada1')
    await page.getByRole('button', { name: /Entrar/i }).click()

    // Aguardar feedback de erro
    await expect(page.getByText(/Credenciais inválidas|Email ou senha incorretos|inválido/i)).toBeVisible({ timeout: 5000 })
  })

  test('deve ter link para criar conta', async ({ page }) => {
    await page.goto('/auth/login')

    const signupLink = page.getByRole('link', { name: /Criar conta|Registre-se|Cadastre-se/i })
    await expect(signupLink).toBeVisible()
    await signupLink.click()
    await expect(page).toHaveURL(/\/auth\/signup|\/auth\/register/i)
  })

  test('deve ter link para recuperar senha', async ({ page }) => {
    await page.goto('/auth/login')

    const forgotLink = page.getByRole('link', { name: /Esqueci|esqueci|Recuperar/i })
    await expect(forgotLink).toBeVisible()
  })
})

test.describe('Autenticação - Cadastro', () => {
  test('deve exibir a página de cadastro corretamente', async ({ page }) => {
    await page.goto('/auth/signup')

    await expect(page.getByLabel(/Nome/i)).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Senha/i).first()).toBeVisible()
  })

  test('deve exibir erro ao tentar cadastro com email já usado', async ({ page }) => {
    await page.goto('/auth/signup')

    // Tentar cadastrar com email do admin (já existe)
    await page.getByLabel(/Nome/i).fill('Admin Teste')
    await page.getByLabel(/Email/i).fill('admin@linkbio.com')

    const usernameField = page.getByLabel(/Username|Nome de usuário/i)
    if (await usernameField.isVisible()) {
      await usernameField.fill('testuser_dup')
    }

    await page.getByLabel(/Senha/i).first().fill('Senha123')
    await page.getByRole('button', { name: /Criar conta|Cadastrar|Registrar/i }).click()

    await expect(page.getByText(/já existe|já cadastrado|email.*já/i)).toBeVisible({ timeout: 5000 })
  })

  test('deve exibir erro de validação para senha fraca', async ({ page }) => {
    await page.goto('/auth/signup')

    await page.getByLabel(/Nome/i).fill('Teste')
    await page.getByLabel(/Email/i).fill('novo@teste.com')
    await page.getByLabel(/Senha/i).first().fill('123')
    await page.getByRole('button', { name: /Criar conta|Cadastrar|Registrar/i }).click()

    // Aguardar feedback de erro de validação
    await expect(
      page.getByText(/mínimo|caracteres|senha|fraca/i)
    ).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Rotas Protegidas', () => {
  test('deve redirecionar para login ao acessar dashboard sem autenticação', async ({ page }) => {
    await page.goto('/dashboard')
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login|\/api\/auth\/signin/i, { timeout: 5000 })
  })

  test('deve redirecionar para login ao acessar perfil sem autenticação', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth\/login|\/api\/auth\/signin/i, { timeout: 5000 })
  })
})
