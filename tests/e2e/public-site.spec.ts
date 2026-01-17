import { test, expect } from '@playwright/test';

test.describe('Public Site', () => {
	test('homepage loads with hero section', async ({ page }) => {
		await page.goto('/');
		
		// Hero loads
		await expect(page.locator('h1')).toContainText("Daesy's Tropical Sno");
		await expect(page.getByText('Tropical vibes')).toBeVisible();
	});

	test('navigation links work', async ({ page }) => {
		await page.goto('/');
		
		// Menu link scrolls to menu section
		await page.getByRole('link', { name: /View The Menu/i }).click();
		await expect(page.locator('#menu')).toBeVisible();
		
		// Catering link scrolls to catering section
		await page.getByRole('link', { name: /Book Your Event/i }).click();
		await expect(page.locator('#catering')).toBeVisible();
	});

	test('flavors section displays', async ({ page }) => {
		await page.goto('/');
		
		// Wait for flavors to load
		await expect(page.getByText('Take Your Pick')).toBeVisible();
	});

	test('catering form is accessible', async ({ page }) => {
		await page.goto('/');
		
		// Navigate to catering section
		await page.goto('/#catering');
		
		// Form fields are present
		await expect(page.getByLabel(/name/i)).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/phone/i)).toBeVisible();
	});

	test('privacy page loads', async ({ page }) => {
		await page.goto('/privacy');
		
		await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Back to the Chill/i }).first()).toBeVisible();
	});
});
