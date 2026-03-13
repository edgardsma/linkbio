import { test, expect } from '@playwright/test'

test.describe('Templates e Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
  })

  test('Deve fazer login e acessar o dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@linkbio.com')
    await page.fill('input[type="password"]', '12345678')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
    await expect(page).toHaveURL('http://localhost:3000/dashboard')
  })

  test('Deve acessar a galeria de templates', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@linkbio.com')
    await page.fill('input[type="password"]', '12345678')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
    await page.goto('http://localhost:3000/templates')
    await expect(page.locator('h1')).toHaveText('Galeria de Templates')
    const templateCards = page.locator('.grid > div')
    await expect(templateCards).toHaveCount.greaterThan(0)
  })

  test('Deve filtrar templates por categoria', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@linkbio.com')
    await page.fill('input[type="password"]', '12345678')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
    await page.goto('http://localhost:3000/templates')
    await page.click('button:has-text("Fashion")')
    await page.waitForTimeout(500)
    const fashionTemplate = page.locator('text=Fashion')
    await expect(fashionTemplate).toBeVisible()
  })

  test('Deve usar um template e ser redirecionado para o dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@linkbio.com')
    await page.fill('input[type="password"]', '12345678')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
    await page.goto('http://localhost:3000/templates')
    await page.click('button:has-text("Usar Template")').first()
    await page.waitForSelector('text=Template aplicado com sucesso!', { timeout: 5000 })
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('Deve acessar o editor visual de personalização', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@linkbio.com')
    await page.fill('input[type="password"]', '12345678')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
    await page.goto('http://localhost:3000/dashboard/edit')
    await expect(page.locator('h1')).toHaveText('Personalizar Página')
    await expect(page.locator('text=Editor Visual')).toBeVisible()
    await expect(page.locator('text=Preview')).toBeVisible()
  })
})
