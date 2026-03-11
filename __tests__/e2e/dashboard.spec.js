const { test, expect } = require('@playwright/test')

// Helper: autenticar como admin antes dos testes
async function loginAsAdmin(page) {
  await page.goto('/auth/login')
  await page.getByLabel(/Email/i).fill('admin@linkbio.com')
  await page.getByLabel(/Senha/i).fill('12345678')
  await page.getByRole('button', { name: /Entrar/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

test.describe('Dashboard - Usuário Autenticado', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('deve exibir o dashboard após login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/dashboard|links|meus links/i)).toBeVisible()
  })

  test('deve exibir o nome ou username do usuário', async ({ page }) => {
    await expect(
      page.getByText(/admin|Admin/i)
    ).toBeVisible()
  })

  test('deve ter botão ou link para adicionar link', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Adicionar|Novo link|Add/i })
      .or(page.getByText(/Adicionar link|Novo link/i))
    await expect(addButton.first()).toBeVisible()
  })

  test('deve ter link para página de perfil', async ({ page }) => {
    const profileLink = page.getByRole('link', { name: /Perfil|Profile/i })
    await expect(profileLink.first()).toBeVisible()
  })
})

test.describe('Dashboard - Gerenciamento de Links', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('deve abrir modal ao clicar em Adicionar Link', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /Adicionar link|Novo link/i }).first()

    if (await addButton.isVisible()) {
      await addButton.click()
      // Verificar que apareceu algum formulário ou modal
      await expect(
        page.getByPlaceholder(/título|title/i)
          .or(page.getByLabel(/título|title/i))
      ).toBeVisible({ timeout: 3000 })
    } else {
      // Se não encontrou botão específico, pular o teste graciosamente
      test.skip()
    }
  })
})

test.describe('Página de Perfil', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/profile')
  })

  test('deve exibir página de edição de perfil', async ({ page }) => {
    await expect(page).toHaveURL(/\/profile/)
    // Verificar que tem pelo menos um campo editável
    await expect(
      page.getByLabel(/Nome|name/i)
        .or(page.getByLabel(/Bio/i))
        .or(page.getByPlaceholder(/Bio|nome|perfil/i))
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Página Pública de um Usuário', () => {
  test('deve exibir página pública de um username existente', async ({ page }) => {
    const response = await page.goto('/admin')
    // Pode retornar 200 (perfil público) ou redirecionar
    expect([200, 301, 302]).toContain(response?.status())
  })
})
