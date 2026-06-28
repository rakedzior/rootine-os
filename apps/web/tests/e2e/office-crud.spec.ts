import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated CRUD tests.');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

type SeededDocument = {
  client: SupabaseClient;
  id: string;
};

async function seedOfficeDocument(name: string): Promise<SeededDocument> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to seed Office document tests.');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: email!,
    password: password!,
  });
  if (authError || !authData.user) throw authError ?? new Error('Missing E2E auth user.');

  const { data, error } = await client
    .from('documents')
    .insert({
      user_id: authData.user.id,
      name,
      category: 'Dokumenty',
      issue_date: '2026-01-01',
      expires_on: '2027-01-01',
      reminder_enabled: false,
      notes: 'Seeded by Playwright Office file-flow coverage.',
      is_archived: false,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { client, id: data.id as string };
}

async function cleanupOfficeDocument({ client, id }: SeededDocument) {
  const { data } = await client.from('documents').select('file_path').eq('id', id).maybeSingle();
  const filePath = data?.file_path as string | null | undefined;
  if (filePath) await client.storage.from('documents').remove([filePath]);
  await client.from('documents').delete().eq('id', id);
  await client.auth.signOut();
}

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

test('uploads, opens, and removes an office document file', async ({ page }) => {
  const title = `E2E office document ${Date.now()}`;
  const seeded = await seedOfficeDocument(title);

  try {
    await page.goto('/office');
    await page.locator('button.office-panel-footer').filter({ hasText: /dokument/i }).click();

    const documentRow = page.getByRole('row').filter({ hasText: title });
    await expect(documentRow).toBeVisible();

    await documentRow.locator('input[type="file"]').setInputFiles({
      name: 'office-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n'),
    });

    await expect(documentRow.getByRole('button', { name: /otw/i })).toBeVisible();
    await expect(documentRow.getByRole('button').filter({ hasText: /plik/i })).toBeVisible();

    const signedUrlResponsePromise = page
      .waitForResponse(
        (response) => response.url().includes('/storage/v1/object/sign/documents/') && response.status() < 400,
        { timeout: 5_000 },
      )
      .catch(() => null);
    const popupPromise = page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null);
    await documentRow.getByRole('button', { name: /otw/i }).click();
    const signedUrlResponse = await signedUrlResponsePromise;
    const popup = await popupPromise;

    if (signedUrlResponse) {
      await popup?.close();
    } else {
      await expect(page.getByRole('dialog')).toContainText(/MFA|uwierzyteln/i);
      await page.getByRole('dialog').getByRole('button', { name: /anuluj/i }).click();
    }

    await documentRow.getByRole('button').filter({ hasText: /plik/i }).click();
    await expect(documentRow.getByText(/dodaj plik/i)).toBeVisible();

    const { data, error } = await seeded.client.from('documents').select('file_path').eq('id', seeded.id).single();
    if (error) throw error;
    expect(data.file_path).toBeNull();
  } finally {
    await cleanupOfficeDocument(seeded);
  }
});
