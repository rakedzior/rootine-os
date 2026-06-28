import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated CRUD tests.');

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill(email!);
  await page.locator('#password').fill(password!);
  await page.getByRole('button', { name: /zaloguj|login/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('creates, completes, and deletes an office task', async ({ page }) => {
  const title = `E2E office task ${Date.now()}`;

  await page.goto('/office');
  await page.getByRole('button', { name: /nowe zadanie/i }).click();
  await page.getByPlaceholder(/paszport/i).fill(title);
  await page.getByRole('button', { name: /^dodaj$/i }).click();

  const taskRow = page.locator('.office-case-row').filter({ hasText: title });
  await expect(taskRow).toBeVisible();

  await taskRow.getByRole('button', { name: /status/i }).click();
  await expect(taskRow).toHaveClass(/is-done/);

  await taskRow.getByRole('button', { name: new RegExp(title, 'i') }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^usu/i }).click();
  await expect(taskRow).toHaveCount(0);
});
