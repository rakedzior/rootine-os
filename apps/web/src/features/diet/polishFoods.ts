/**
 * Built-in database of common Polish generic foods (per 100g).
 * Covers everyday ingredients not found in Open Food Facts (which is barcode/branded only).
 * Values are standard nutritional averages.
 */

export interface BuiltinFood {
  name: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}

export const POLISH_FOODS: BuiltinFood[] = [
  // Drob
  { name: 'Piersz kurczaka', kcal: 110, protein: 23.1, carb: 0, fat: 1.2 },
  { name: 'Udziec kurczaka', kcal: 184, protein: 19.7, carb: 0, fat: 11.5 },
  { name: 'Skrzydla kurczaka', kcal: 222, protein: 18.3, carb: 0, fat: 16.0 },
  { name: 'Kurczak caly', kcal: 239, protein: 17.6, carb: 0, fat: 18.4 },
  { name: 'Pierś z indyka', kcal: 104, protein: 22.3, carb: 0, fat: 1.2 },
  { name: 'Mielone z indyka', kcal: 149, protein: 17.5, carb: 0, fat: 8.3 },
  { name: 'Kaczka', kcal: 337, protein: 11.5, carb: 0, fat: 31.7 },

  // Wieprzowina
  { name: 'Schab wieprzowy', kcal: 172, protein: 20.7, carb: 0, fat: 9.5 },
  { name: 'Polędwica wieprzowa', kcal: 143, protein: 21.0, carb: 0, fat: 6.4 },
  { name: 'Karkówka', kcal: 258, protein: 16.4, carb: 0, fat: 21.1 },
  { name: 'Boczek', kcal: 458, protein: 13.0, carb: 0.5, fat: 45.0 },
  { name: 'Żeberka wieprzowe', kcal: 292, protein: 17.1, carb: 0, fat: 24.7 },
  { name: 'Mielone wieprzowe', kcal: 263, protein: 16.6, carb: 0, fat: 22.0 },
  { name: 'Golonka', kcal: 296, protein: 18.6, carb: 0, fat: 24.8 },

  // Wolowina
  { name: 'Rostbef wolowy', kcal: 158, protein: 26.1, carb: 0, fat: 6.0 },
  { name: 'Antrykot wolowy', kcal: 247, protein: 17.4, carb: 0, fat: 19.5 },
  { name: 'Mielone wolowe', kcal: 254, protein: 17.2, carb: 0, fat: 20.4 },
  { name: 'Polędwica wolowa', kcal: 158, protein: 22.0, carb: 0, fat: 8.0 },
  { name: 'Łopatka wolowa', kcal: 156, protein: 21.4, carb: 0, fat: 7.8 },

  // Ryby i owoce morza
  { name: 'Łosoś', kcal: 208, protein: 20.0, carb: 0, fat: 13.0 },
  { name: 'Łosoś pieczony', kcal: 216, protein: 22.1, carb: 0, fat: 13.9 },
  { name: 'Dorsz', kcal: 82, protein: 17.8, carb: 0, fat: 0.7 },
  { name: 'Tuńczyk w wodzie', kcal: 116, protein: 25.5, carb: 0, fat: 1.0 },
  { name: 'Tuńczyk w oleju', kcal: 198, protein: 24.0, carb: 0, fat: 11.0 },
  { name: 'Pstrąg', kcal: 148, protein: 20.7, carb: 0, fat: 7.2 },
  { name: 'Śledź', kcal: 158, protein: 18.0, carb: 0, fat: 9.0 },
  { name: 'Makrela', kcal: 205, protein: 18.6, carb: 0, fat: 13.9 },
  { name: 'Krewetki', kcal: 99, protein: 20.9, carb: 0, fat: 1.7 },

  // Jaja i nabiał
  { name: 'Jajko kurze (całe)', kcal: 155, protein: 12.6, carb: 1.1, fat: 10.6 },
  { name: 'Białko jaja', kcal: 52, protein: 10.9, carb: 0.7, fat: 0.2 },
  { name: 'Żółtko jaja', kcal: 322, protein: 15.9, carb: 3.6, fat: 26.5 },
  { name: 'Mleko 2%', kcal: 50, protein: 3.4, carb: 4.8, fat: 2.0 },
  { name: 'Mleko 3.2%', kcal: 61, protein: 3.2, carb: 4.8, fat: 3.2 },
  { name: 'Jogurt naturalny', kcal: 61, protein: 3.5, carb: 4.7, fat: 3.3 },
  { name: 'Jogurt grecki 0%', kcal: 57, protein: 10.0, carb: 3.5, fat: 0.4 },
  { name: 'Serek wiejski', kcal: 98, protein: 11.1, carb: 3.4, fat: 4.3 },
  { name: 'Twaróg chudy', kcal: 72, protein: 12.5, carb: 2.5, fat: 1.2 },
  { name: 'Twaróg tłusty', kcal: 144, protein: 11.5, carb: 2.5, fat: 9.8 },
  { name: 'Ser żółty (gouda)', kcal: 356, protein: 25.0, carb: 2.2, fat: 27.4 },
  { name: 'Mozzarella', kcal: 280, protein: 18.0, carb: 2.2, fat: 22.4 },
  { name: 'Parmezan', kcal: 431, protein: 38.5, carb: 0, fat: 29.7 },
  { name: 'Masło', kcal: 717, protein: 0.9, carb: 0.1, fat: 81.1 },
  { name: 'Śmietana 18%', kcal: 188, protein: 2.8, carb: 3.7, fat: 18.0 },

  // Zboża i produkty zbożowe
  { name: 'Ryż biały gotowany', kcal: 130, protein: 2.7, carb: 28.2, fat: 0.3 },
  { name: 'Ryż brązowy gotowany', kcal: 123, protein: 2.7, carb: 25.6, fat: 1.0 },
  { name: 'Makaron gotowany', kcal: 131, protein: 5.0, carb: 25.0, fat: 1.1 },
  { name: 'Kasza gryczana gotowana', kcal: 110, protein: 4.0, carb: 23.0, fat: 0.6 },
  { name: 'Kasza jaglana gotowana', kcal: 119, protein: 3.5, carb: 23.7, fat: 1.0 },
  { name: 'Owsianka gotowana', kcal: 71, protein: 2.5, carb: 12.0, fat: 1.5 },
  { name: 'Płatki owsiane', kcal: 389, protein: 16.9, carb: 66.3, fat: 6.9 },
  { name: 'Chleb pszenny', kcal: 265, protein: 8.5, carb: 52.0, fat: 2.5 },
  { name: 'Chleb żytni', kcal: 259, protein: 8.5, carb: 48.3, fat: 3.3 },
  { name: 'Chleb razowy', kcal: 247, protein: 8.4, carb: 41.3, fat: 3.4 },
  { name: 'Bułka pszenna', kcal: 271, protein: 9.1, carb: 53.0, fat: 2.6 },
  { name: 'Tortilla pszenna', kcal: 306, protein: 8.0, carb: 52.0, fat: 7.0 },

  // Warzywa
  { name: 'Ziemniaki gotowane', kcal: 77, protein: 2.0, carb: 17.0, fat: 0.1 },
  { name: 'Bataty gotowane', kcal: 90, protein: 2.0, carb: 20.7, fat: 0.1 },
  { name: 'Brokuły', kcal: 34, protein: 2.8, carb: 6.6, fat: 0.4 },
  { name: 'Szpinak', kcal: 23, protein: 2.9, carb: 3.6, fat: 0.4 },
  { name: 'Pomidor', kcal: 18, protein: 0.9, carb: 3.9, fat: 0.2 },
  { name: 'Ogórek', kcal: 15, protein: 0.7, carb: 3.6, fat: 0.1 },
  { name: 'Sałata', kcal: 15, protein: 1.4, carb: 2.9, fat: 0.2 },
  { name: 'Papryka czerwona', kcal: 31, protein: 1.0, carb: 6.0, fat: 0.3 },
  { name: 'Marchewka', kcal: 41, protein: 0.9, carb: 9.6, fat: 0.2 },
  { name: 'Cebula', kcal: 40, protein: 1.1, carb: 9.3, fat: 0.1 },
  { name: 'Czosnek', kcal: 149, protein: 6.4, carb: 33.1, fat: 0.5 },
  { name: 'Pieczarki', kcal: 22, protein: 3.1, carb: 3.3, fat: 0.3 },

  // Owoce
  { name: 'Banan', kcal: 89, protein: 1.1, carb: 22.8, fat: 0.3 },
  { name: 'Jabłko', kcal: 52, protein: 0.3, carb: 13.8, fat: 0.2 },
  { name: 'Pomarańcza', kcal: 47, protein: 0.9, carb: 11.8, fat: 0.1 },
  { name: 'Truskawki', kcal: 32, protein: 0.7, carb: 7.7, fat: 0.3 },
  { name: 'Jagody', kcal: 57, protein: 0.7, carb: 14.5, fat: 0.3 },
  { name: 'Winogrona', kcal: 67, protein: 0.6, carb: 17.2, fat: 0.2 },

  // Tluszcze i oleje
  { name: 'Oliwa z oliwek', kcal: 884, protein: 0, carb: 0, fat: 100.0 },
  { name: 'Olej rzepakowy', kcal: 884, protein: 0, carb: 0, fat: 100.0 },
  { name: 'Olej kokosowy', kcal: 862, protein: 0, carb: 0, fat: 99.1 },

  // Orzechy i nasiona
  { name: 'Migdały', kcal: 579, protein: 21.2, carb: 21.6, fat: 49.9 },
  { name: 'Orzechy włoskie', kcal: 654, protein: 15.2, carb: 13.7, fat: 65.2 },
  { name: 'Orzechy nerkowca', kcal: 553, protein: 18.2, carb: 30.2, fat: 43.9 },
  { name: 'Masło orzechowe', kcal: 588, protein: 25.1, carb: 20.1, fat: 50.4 },
  { name: 'Siemię lniane', kcal: 534, protein: 18.3, carb: 28.9, fat: 42.2 },
  { name: 'Pestki dyni', kcal: 559, protein: 30.2, carb: 10.7, fat: 49.1 },

  // Rosliny straczkowe
  { name: 'Fasola gotowana', kcal: 127, protein: 8.7, carb: 22.8, fat: 0.5 },
  { name: 'Soczewica gotowana', kcal: 116, protein: 9.0, carb: 20.1, fat: 0.4 },
  { name: 'Ciecierzyca gotowana', kcal: 164, protein: 8.9, carb: 27.4, fat: 2.6 },
  { name: 'Tofu', kcal: 76, protein: 8.1, carb: 1.9, fat: 4.8 },

  // Inne
  { name: 'Jajka sadzone', kcal: 196, protein: 13.6, carb: 0.9, fat: 15.1 },
  { name: 'Jajecznica (2 jajka)', kcal: 183, protein: 11.4, carb: 1.2, fat: 14.8 },
  { name: 'Olej z oliwek (łyżka)', kcal: 119, protein: 0, carb: 0, fat: 13.5 },
];
