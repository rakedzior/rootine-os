/**
 * fatsecret-search — proxy for FatSecret Platform REST API
 *
 * Query params:
 *   q        — search term (required)
 *   lang     — "pl" (default) or "en"
 *   max      — max results, default 20
 *
 * Supabase secrets required:
 *   FATSECRET_CLIENT_ID
 *   FATSECRET_CLIENT_SECRET
 *
 * Set via CLI:
 *   supabase secrets set FATSECRET_CLIENT_ID=your_id
 *   supabase secrets set FATSECRET_CLIENT_SECRET=your_secret
 */

const CLIENT_ID = Deno.env.get('FATSECRET_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('FATSECRET_CLIENT_SECRET') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FatSecretFoodRaw {
  food_id: string;
  food_name: string;
  food_type?: string;
  food_description?: string;
}

interface FoodResult {
  external_id: string;
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  per_amount: number;
  unit: string;
}

/** Parse "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g" */
function parseDescription(desc: string): Omit<FoodResult, 'external_id' | 'name'> {
  const per = desc.match(/Per\s+([\d.]+)\s*(\w+)/i);
  const kcal = desc.match(/Calories?:\s*([\d.]+)\s*kcal/i);
  const fat = desc.match(/Fat:\s*([\d.]+)\s*g/i);
  const carb = desc.match(/Carbs?:\s*([\d.]+)\s*g/i);
  const prot = desc.match(/Protein:\s*([\d.]+)\s*g/i);
  return {
    per_amount: per ? Number(per[1]) : 100,
    unit: per ? per[2].toLowerCase() : 'g',
    kcal: kcal ? Math.round(Number(kcal[1])) : 0,
    fat: fat ? Number(fat[1]) : 0,
    carb: carb ? Number(carb[1]) : 0,
    protein: prot ? Number(prot[1]) : 0,
  };
}

async function getToken(): Promise<string> {
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'basic',
    }),
  });
  if (!res.ok) throw new Error(`FatSecret token error: ${res.status}`);
  const json = await res.json() as { access_token: string };
  return json.access_token;
}

async function searchFoods(token: string, query: string, lang: string, max: number): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    method: 'foods.search',
    search_expression: query,
    format: 'json',
    max_results: String(max),
    region: lang === 'pl' ? 'PL' : 'US',
    language: lang,
  });
  const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`FatSecret search error: ${res.status}`);
  const json = await res.json() as { foods?: { food?: FatSecretFoodRaw | FatSecretFoodRaw[] }; error?: { message: string } };

  if (json.error) throw new Error(json.error.message);
  if (!json.foods?.food) return [];

  // API returns object (1 result) or array (multiple)
  const foods = Array.isArray(json.foods.food) ? json.foods.food : [json.foods.food];

  return foods.map((f): FoodResult => {
    const macros = f.food_description ? parseDescription(f.food_description) : { kcal: 0, protein: 0, carb: 0, fat: 0, per_amount: 100, unit: 'g' };
    return { external_id: f.food_id, name: f.food_name, ...macros };
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') ?? '';
    const lang = url.searchParams.get('lang') ?? 'pl';
    const max = Math.min(Number(url.searchParams.get('max') ?? '20'), 50);

    if (!query.trim()) {
      return new Response(JSON.stringify({ foods: [] }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'FatSecret keys not configured' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const token = await getToken();
    const foods = await searchFoods(token, query, lang, max);

    return new Response(JSON.stringify({ foods }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
