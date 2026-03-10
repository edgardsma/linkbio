const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
    test('should load correctly', async ({ page }) => {
        await page.goto('/');

        // Verificar título
        await expect(page).toHaveTitle(/LinkBio Brasil/);

        // Verificar botões principais
        const ctaButton = page.getByRole('link', { name: /Criar Conta/i }).first();
        await expect(ctaButton).toBeVisible();

        const loginLink = page.getByRole('link', { name: /Entrar/i });
        await expect(loginLink).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: /Entrar/i }).click();
        await expect(page).toHaveURL(/\/auth\/login/);
        await expect(page.getByRole('heading', { name: /Entrar na sua conta/i })).toBeVisible();
    });
});
