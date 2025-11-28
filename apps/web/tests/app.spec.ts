import { test, expect } from '@playwright/test';

/**
 * Basic smoke tests for BytePad Web App
 */
test.describe('BytePad Web App', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/BytePad 3.0 Companion/i);
    
    // Wait for core to initialize
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /BytePad 3.0/i })).toBeVisible();
  });

  test('should display core UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for key UI elements
    await expect(page.getByRole('button', { name: /\+ Note/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    await page.goto('/');
    
    // Wait for core to initialize and page to be ready
    await page.waitForSelector('button:has-text("+ Note")', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Wait for "No notes yet" message to be visible (confirms initial state)
    await expect(page.getByText(/No notes yet/i)).toBeVisible();
    
    // Click create note button
    await page.getByRole('button', { name: /\+ Note/i }).click();
    
    // Wait for "No notes yet" message to disappear (indicates note was created)
    await expect(page.getByText(/No notes yet/i)).not.toBeVisible({ timeout: 10000 });
    
    // Wait for note card to appear (more reliable than text content)
    await expect(page.locator('[class*="border"]').filter({ hasText: /New Note/i }).first()).toBeVisible({ timeout: 10000 });
    
    // Verify note content is visible
    await expect(page.getByText(/New Note/i)).toBeVisible();
  });

  test('should search notes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // Type in search box
    const searchInput = page.getByRole('textbox', { name: /search/i }).first();
    await searchInput.fill('test');
    
    // Search should work (no errors)
    await expect(searchInput).toHaveValue('test');
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('sourcemap')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

