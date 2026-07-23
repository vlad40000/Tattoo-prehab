import { expect, test } from '@playwright/test';

test('workday shell exposes core workflows', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /protect the hand/i })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare' }).first().click();
  await expect(page.getByRole('heading', { name: /eight-minute pre-session routine/i })).toBeVisible();
  await expect(page.getByText('90/90 Breathing Reset').first()).toBeVisible();
});

test('learn area exposes all 33 exercises by region', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn' }).first().click();
  await expect(page.getByText('33 manual-aligned exercises')).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  const regionButtons = page.locator('.region-group > button');
  await expect(regionButtons).toHaveCount(5);
  const counts = await page.locator('.region-group > button em').allTextContents();
  expect(counts).toEqual(['7', '6', '6', '7', '7']);
  await expect(page.locator('iframe')).toHaveCount(0);
});
