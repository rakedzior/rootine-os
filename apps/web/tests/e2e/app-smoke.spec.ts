import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.');

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/haslo|hasło|password/i).fill(password!);
  await page.getByRole('button', { name: /zaloguj|login/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

for (const [path, heading] of [
  ['/', /Planer|Start/],
  ['/finance', /Finanse/],
  ['/diet', /Dieta/],
  ['/sport', /Sport/],
  ['/office', /Biuro/],
  ['/travel', /Podroze|Podróże/],
  ['/notes', /Notatki/],
  ['/goals', /Cele/],
  ['/work', /Praca/],
] as const) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}
