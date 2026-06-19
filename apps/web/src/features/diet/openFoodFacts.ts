/** Open Food Facts public API integration. No API key needed. */

export interface OFFProduct {
  code: string;
  name: string;
  /** kcal per 100g */
  kcal: number;
  /** g protein per 100g */
  protein: number;
  /** g carbs per 100g */
  carb: number;
  /** g fat per 100g */
  fat: number;
}

interface OFFSearchResult {
  products: Array<{
    code?: string;
    product_name?: string;
    product_name_pl?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal'?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
    };
  }>;
}

function toProduct(p: OFFSearchResult['products'][0]): OFFProduct | null {
  const name = p.product_name_pl || p.product_name;
  if (!name) return null;
  const n = p.nutriments ?? {};
  const kcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0;
  return {
    code: p.code ?? '',
    name,
    kcal: Math.round(kcal),
    protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carb: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
  };
}

/** Search products by name. Returns up to 20 results. */
export async function searchProducts(query: string): Promise<OFFProduct[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    fields: 'code,product_name,product_name_pl,nutriments',
    page_size: '20',
    sort_by: 'unique_scans_n',
  });
  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`);
  if (!res.ok) throw new Error('Błąd wyszukiwania');
  const data: OFFSearchResult = await res.json();
  return (data.products ?? []).map(toProduct).filter(Boolean) as OFFProduct[];
}

/** Fetch product by barcode. Returns null if not found. */
export async function fetchByBarcode(barcode: string): Promise<OFFProduct | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=code,product_name,product_name_pl,nutriments`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return toProduct(data.product);
}
