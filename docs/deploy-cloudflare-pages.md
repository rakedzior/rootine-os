# Cloudflare Pages deploy

Rootine OS is deployed as a static Vite SPA. Backend logic stays in Supabase Edge Functions.

## Cloudflare Pages settings

- Framework preset: `Vite`
- Root directory: `apps/web`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20`

The Vite build copies `apps/web/public/_redirects` and `apps/web/public/_headers` into `dist`.

## Environment variables

Set these in Cloudflare Pages for Production and Preview as needed:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID
VITE_STRAVA_CLIENT_ID
VITE_PEXELS_API_KEY
```

Do not add Supabase service-role keys or OAuth client secrets to Cloudflare Pages. Keep secrets in Supabase Edge Function secrets:

```text
GOOGLE_CLIENT_SECRET
STRAVA_CLIENT_SECRET
TOKEN_ENC_KEY
APP_URL
```

Set `APP_URL` to the production Cloudflare Pages/custom-domain URL.

## OAuth notes

Google and Strava provider callback URLs still point to Supabase Edge Functions:

```text
https://kolmleeastcfvsvyasap.supabase.co/functions/v1/oauth-google
https://kolmleeastcfvsvyasap.supabase.co/functions/v1/oauth-strava
```

After moving production to Cloudflare Pages, verify both providers from the production URL and update any provider-side allowed origins/domains if needed.

## CLI deploy

For a manual deploy from `apps/web`:

```powershell
npm run deploy:cloudflare
```
