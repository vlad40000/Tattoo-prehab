import { expect, test } from '@playwright/test';

test('Tattoo Prehab readiness branches and launches the guided runner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /keep tattooing/i })).toBeVisible();
  await page.getByRole('button', { name: /red/i }).click();
  await expect(page.getByRole('heading', { name: /review symptoms before training/i })).toBeVisible();

  await page.getByRole('navigation', { name: /primary navigation/i }).getByRole('button', { name: 'Train' }).click();
  await page.getByRole('button', { name: /eight-minute pre-session routine/i }).first().click();
  await expect(page.getByText('90/90 Breathing Reset').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /watch 90\/90 breathing reset demonstration/i })).toBeVisible();
  await page.getByRole('button', { name: /start guided session/i }).click();

  const runner = page.getByRole('dialog', { name: /running session/i });
  await expect(runner.getByRole('heading', { name: '90/90 Breathing Reset' })).toBeVisible();
  await runner.getByRole('button', { name: /complete set 1/i }).click();
  await expect(runner.getByRole('button', { name: /set 1 complete/i })).toHaveAttribute('aria-pressed', 'true');
  await runner.getByRole('button', { name: /open stop rules/i }).click();
  await expect(page.getByRole('heading', { name: /how to read what you are feeling/i })).toBeVisible();
  await page.getByRole('button', { name: /close stop rules/i }).click();
  await runner.getByRole('button', { name: /pause and leave session/i }).click();
  await expect(page.getByText(/session paused/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /restart/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /discard/i })).toBeVisible();
});

test('exercise library exposes all 33 exercises and approved-video indicators', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: /primary navigation/i }).getByRole('button', { name: 'Learn' }).click();
  await expect(page.getByText('33 exercises · 21 video guides')).toBeVisible();
  const regionButtons = page.locator('.region-group > button');
  await expect(regionButtons).toHaveCount(5);
  const counts = await page.locator('.region-group > button em').allTextContents();
  expect(counts).toEqual(['7', '6', '6', '7', '7']);
  await expect(page.locator('iframe')).toHaveCount(0);
});
