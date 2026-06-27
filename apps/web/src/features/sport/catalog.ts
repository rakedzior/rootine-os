/**
 * Sport — static reference data: disciplines, muscle/joint taxonomy,
 * template categories and the seeded exercise catalog.
 *
 * Discipline keys are the Polish display labels themselves (matches the
 * convention already used by `sportType` across the Sport module), so this
 * file is a drop-in extension rather than a rename of existing data.
 */

/**
 * Sport categories used to be a fixed union of 5 disciplines. The live list now
 * comes from Supabase and is seeded from `SPORTS`; `SportKey` stays a plain
 * string so existing annotations keep compiling while users can extend the list.
 */
export type SportKey = string;

export interface SportDef {
  key: SportKey;
  emoji: string;
  shortLabel: string;
}

export const SPORTS: SportDef[] = [
  { key: 'Siłownia',     emoji: '🏋️', shortLabel: 'Siłownia' },
  { key: 'Bieganie',     emoji: '🏃', shortLabel: 'Bieganie' },
  { key: 'Wspinaczka',   emoji: '🧗', shortLabel: 'Wspinaczka' },
  { key: 'Mobilność',    emoji: '🤸', shortLabel: 'Mobilność' },
  { key: 'Rehabilitacja', emoji: '🩹', shortLabel: 'Rehabilitacja' },
];

export const SPORT_KEYS: SportKey[] = SPORTS.map((s) => s.key);

// ─── MUSCLE / JOINT TAXONOMY ───────────────────────────────────
// `visual` groups several anatomically-close keys onto the same shape in
// the simplified BodyMap silhouette (e.g. hip flexors + adductors both
// light up the "hips" block) while every key stays independently
// selectable for exercise tagging, filters and analysis.

export type MuscleKey =
  | 'neck' | 'front_delts' | 'side_delts' | 'rear_delts' | 'chest' | 'lats'
  | 'upper_back' | 'lower_back' | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques' | 'glutes' | 'quads' | 'hamstrings' | 'adductors'
  | 'hip_flexors' | 'calves' | 'knee' | 'elbow' | 'wrist' | 'ankle' | 'shoulder';

export interface MuscleDef {
  key: MuscleKey;
  label: string;
  side: 'front' | 'back' | 'both';
  visual: string;
}

export const MUSCLES: MuscleDef[] = [
  { key: 'neck',         label: 'Kark',                  side: 'both',  visual: 'neck' },
  { key: 'front_delts',  label: 'Przednie barki',        side: 'front', visual: 'shoulder_front' },
  { key: 'side_delts',   label: 'Boczne barki',          side: 'both',  visual: 'shoulder_front' },
  { key: 'rear_delts',   label: 'Tylne barki',           side: 'back',  visual: 'shoulder_back' },
  { key: 'chest',        label: 'Klatka piersiowa',      side: 'front', visual: 'chest' },
  { key: 'lats',         label: 'Najszersze grzbietu',   side: 'back',  visual: 'lats' },
  { key: 'upper_back',   label: 'Górna część grzbietu',  side: 'back',  visual: 'upper_back' },
  { key: 'lower_back',   label: 'Dolna część grzbietu / lędźwie', side: 'back', visual: 'lower_back' },
  { key: 'biceps',       label: 'Biceps',                side: 'front', visual: 'upper_arm_front' },
  { key: 'triceps',      label: 'Triceps',                side: 'back',  visual: 'upper_arm_back' },
  { key: 'forearms',     label: 'Przedramiona',          side: 'both',  visual: 'forearm' },
  { key: 'abs',          label: 'Brzuch',                side: 'front', visual: 'abs' },
  { key: 'obliques',     label: 'Skośne brzucha',        side: 'front', visual: 'abs' },
  { key: 'glutes',       label: 'Pośladki',              side: 'back',  visual: 'glutes' },
  { key: 'quads',        label: 'Czworogłowe uda',       side: 'front', visual: 'thigh_front' },
  { key: 'hamstrings',   label: 'Dwugłowe uda',          side: 'back',  visual: 'thigh_back' },
  { key: 'adductors',    label: 'Przywodziciele',        side: 'front', visual: 'hips_front' },
  { key: 'hip_flexors',  label: 'Zginacze bioder',       side: 'front', visual: 'hips_front' },
  { key: 'calves',       label: 'Łydki',                 side: 'both',  visual: 'calf' },
  { key: 'knee',         label: 'Kolano',                side: 'both',  visual: 'knee' },
  { key: 'elbow',        label: 'Łokieć',                side: 'both',  visual: 'elbow' },
  { key: 'wrist',        label: 'Nadgarstek',            side: 'both',  visual: 'wrist' },
  { key: 'ankle',        label: 'Skokowy',               side: 'both',  visual: 'ankle' },
  { key: 'shoulder',     label: 'Bark (staw)',           side: 'both',  visual: 'shoulder_joint' },
];

export const MUSCLE_LABEL: Record<MuscleKey, string> = MUSCLES.reduce(
  (acc, m) => ({ ...acc, [m.key]: m.label }),
  {} as Record<MuscleKey, string>,
);

// ─── TEMPLATE CATEGORIES (per sport) ───────────────────────────

export const TEMPLATE_CATEGORIES: Record<SportKey, string[]> = {
  'Siłownia': ['Push', 'Pull', 'Legs', 'Full Body', 'Upper', 'Lower', 'Hypertrofia', 'Siła', 'Deload'],
  'Bieganie': ['Easy Run', 'Interwały', 'Tempo', 'Long Run', 'Regeneracyjny', 'Podbiegi'],
  'Wspinaczka': ['Boulder', 'Lina', 'Technika', 'Siła palców', 'Wytrzymałość', 'Mobilność wspinaczkowa'],
  'Mobilność': ['Full Body', 'Biodra', 'Barki', 'Kręgosłup', 'Nadgarstki', 'Kostki'],
  'Rehabilitacja': ['Kolano', 'Bark', 'Łokieć', 'Lędźwie', 'Skokowy', 'Nadgarstek'],
};

export const EQUIPMENT_OPTIONS = [
  'Sztanga', 'Hantle', 'Maszyna', 'Własna waga', 'Kettlebell', 'Linka',
  'Drążek', 'Poręcze', 'Guma oporowa', 'Piłka', 'Wałek (foam roller)',
  'Chwyty / boulder wall', 'Liny wspinaczkowe', 'Brak / teren',
];

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Początkujący', intermediate: 'Średniozaawansowany', advanced: 'Zaawansowany',
};

// ─── EXERCISE CATALOG ───────────────────────────────────────────

export interface ExerciseDef {
  id: string;
  name: string;
  aliases: string[];
  sport: SportKey;
  category: string;
  equipment: string[];
  difficulty: Difficulty;
  movementPattern: string;
  primaryMuscles: MuscleKey[];
  secondaryMuscles: MuscleKey[];
  stabilizerMuscles: MuscleKey[];
  instructions: string;
  tips: string;
  contraindications: string;
  rehabSafe: boolean;
  tags: string[];
}

function ex(e: Omit<ExerciseDef, 'id'> & { id: string }): ExerciseDef {
  return e;
}

export const EXERCISE_CATALOG: ExerciseDef[] = [
  // ── SIŁOWNIA — PUSH ─────────────────────────────────────────
  ex({
    id: 'gym-bench-press', name: 'Wyciskanie sztangi na ławce płaskiej', aliases: ['Bench press', 'Wyciskanie leżąc'],
    sport: 'Siłownia', category: 'Push', equipment: ['Sztanga'], difficulty: 'intermediate', movementPattern: 'Push horyzontalny',
    primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'], stabilizerMuscles: ['abs'],
    instructions: 'Sztanga nad dolną częścią klatki, łopatki ściągnięte, schodzenie kontrolowane do dotknięcia klatki, wyprost bez odbicia.',
    tips: 'Trzymaj nadgarstki w jednej linii z przedramieniem, stopy mocno w podłodze.',
    contraindications: 'Ból w stawie barkowym przy pełnym zakresie.', rehabSafe: false, tags: ['hipertrofia', 'siła', 'klasyk'],
  }),
  ex({
    id: 'gym-db-press', name: 'Wyciskanie hantli na ławce płaskiej', aliases: ['DB bench press'],
    sport: 'Siłownia', category: 'Push', equipment: ['Hantle'], difficulty: 'beginner', movementPattern: 'Push horyzontalny',
    primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'], stabilizerMuscles: ['abs'],
    instructions: 'Hantle nad klatką, łokcie ok. 45° od tułowia, pełen zakres bez blokowania stawu w górze.',
    tips: 'Większy zakres ruchu niż ze sztangą — kontroluj fazę negatywną.', contraindications: '', rehabSafe: false, tags: ['hipertrofia'],
  }),
  ex({
    id: 'gym-incline-db-press', name: 'Wyciskanie hantli na ławce skośnej', aliases: ['Incline DB press'],
    sport: 'Siłownia', category: 'Push', equipment: ['Hantle'], difficulty: 'intermediate', movementPattern: 'Push horyzontalny',
    primaryMuscles: ['chest'], secondaryMuscles: ['front_delts'], stabilizerMuscles: ['abs', 'triceps'],
    instructions: 'Ławka 30°, ruch jak przy płaskim wyciskaniu z większym naciskiem na górną część klatki.',
    tips: 'Nie przekraczaj 45° kąta ławki, by nie przejąć pracy barków.', contraindications: '', rehabSafe: false, tags: ['hipertrofia'],
  }),
  ex({
    id: 'gym-cable-fly', name: 'Rozpiętki na bramie / wyciągu', aliases: ['Cable fly', 'Rozpiętki'],
    sport: 'Siłownia', category: 'Push', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Izolacja — przywodzenie ramienia',
    primaryMuscles: ['chest'], secondaryMuscles: ['front_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Lekkie ugięcie łokci, łukowy ruch ramion do złączenia przed klatką.', tips: 'Skup się na ściskaniu klatki, nie na ciężarze.',
    contraindications: '', rehabSafe: false, tags: ['izolacja', 'pompka'],
  }),
  ex({
    id: 'gym-ohp', name: 'Wyciskanie żołnierskie', aliases: ['OHP', 'Military press', 'Wyciskanie nad głowę'],
    sport: 'Siłownia', category: 'Push', equipment: ['Sztanga'], difficulty: 'intermediate', movementPattern: 'Push wertykalny',
    primaryMuscles: ['front_delts'], secondaryMuscles: ['side_delts', 'triceps'], stabilizerMuscles: ['abs', 'lower_back'],
    instructions: 'Sztanga ze stojaków na wysokości klatki, wyciskanie nad głowę bez odginania w lędźwiach.',
    tips: 'Spinaj brzuch i pośladki, by chronić odcinek lędźwiowy.', contraindications: 'Konflikt podbarkowy, ostry ból barku.', rehabSafe: false, tags: ['siła', 'barki'],
  }),
  ex({
    id: 'gym-lateral-raise', name: 'Unoszenie hantli bokiem', aliases: ['Lateral raise'],
    sport: 'Siłownia', category: 'Push', equipment: ['Hantle'], difficulty: 'beginner', movementPattern: 'Izolacja — odwiedzenie ramienia',
    primaryMuscles: ['side_delts'], secondaryMuscles: [], stabilizerMuscles: ['upper_back'],
    instructions: 'Lekkie hantle, unoszenie do wysokości barków z minimalnym pędem.', tips: 'Mniejszy ciężar, więcej kontroli — to ćwiczenie izolowane.',
    contraindications: '', rehabSafe: false, tags: ['izolacja', 'hipertrofia'],
  }),
  ex({
    id: 'gym-triceps-pushdown', name: 'Wyprosty na wyciągu górnym', aliases: ['Triceps pushdown'],
    sport: 'Siłownia', category: 'Push', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Izolacja — wyprost łokcia',
    primaryMuscles: ['triceps'], secondaryMuscles: [], stabilizerMuscles: ['abs'],
    instructions: 'Łokcie przy tułowiu, pełny wyprost ramienia bez ruchu w barku.', tips: 'Nie odpychaj się całym ciałem — izoluj triceps.',
    contraindications: '', rehabSafe: false, tags: ['izolacja'],
  }),
  ex({
    id: 'gym-dips', name: 'Pompki na poręczach', aliases: ['Dips'],
    sport: 'Siłownia', category: 'Push', equipment: ['Poręcze'], difficulty: 'intermediate', movementPattern: 'Push wertykalny',
    primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Tułów lekko pochylony do przodu (klatka) lub pionowo (triceps), kontrolowane zejście do 90° w łokciu.',
    tips: 'Pochylenie tułowia decyduje, czy akcent idzie na klatkę czy triceps.', contraindications: 'Ból przedniego barku.', rehabSafe: false, tags: ['masa ciała'],
  }),

  // ── SIŁOWNIA — PULL ─────────────────────────────────────────
  ex({
    id: 'gym-pullup', name: 'Podciąganie nachwytem', aliases: ['Pull-up'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Drążek'], difficulty: 'advanced', movementPattern: 'Pull wertykalny',
    primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'rear_delts'], stabilizerMuscles: ['abs', 'forearms'],
    instructions: 'Chwyt szerszy niż barki, podciąganie aż broda nad drążek, pełny wyprost na dole.',
    tips: 'Zacznij ruch od ściągnięcia łopatek, nie od zgięcia łokci.', contraindications: '', rehabSafe: false, tags: ['masa ciała', 'klasyk'],
  }),
  ex({
    id: 'gym-barbell-row', name: 'Wiosłowanie sztangą w opadzie', aliases: ['Barbell row'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Sztanga'], difficulty: 'intermediate', movementPattern: 'Pull horyzontalny',
    primaryMuscles: ['upper_back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'], stabilizerMuscles: ['lower_back', 'abs'],
    instructions: 'Tułów pod ~45°, sztanga przyciągana do dolnej klatki/górnego brzucha, łopatki ściągnięte.',
    tips: 'Neutralny kręgosłup przez cały czas — to ćwiczenie wymaga kontroli lędźwi.', contraindications: 'Ostry ból dolnego odcinka kręgosłupa.', rehabSafe: false, tags: ['siła', 'masa'],
  }),
  ex({
    id: 'gym-seated-cable-row', name: 'Wiosłowanie siedząc na wyciągu', aliases: ['Seated cable row'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Pull horyzontalny',
    primaryMuscles: ['upper_back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Plecy w naturalnej krzywiźnie, przyciąganie uchwytu do brzucha z ściągnięciem łopatek.',
    tips: 'Nie kołysz tułowiem żeby oszukać ciężar.', contraindications: '', rehabSafe: true, tags: ['hipertrofia'],
  }),
  ex({
    id: 'gym-lat-pulldown', name: 'Ściąganie drążka wyciągu górnego', aliases: ['Lat pulldown'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Pull wertykalny',
    primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'rear_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Chwyt szeroki, ściąganie drążka do górnej klatki, kontrolowany powrót z pełnym wyprostem.',
    tips: 'Dobra alternatywa dla podciągania, gdy brak siły na pełny pull-up.', contraindications: '', rehabSafe: true, tags: ['masa', 'alternatywa'],
  }),
  ex({
    id: 'gym-face-pull', name: 'Face pull', aliases: [],
    sport: 'Siłownia', category: 'Pull', equipment: ['Maszyna', 'Guma oporowa'], difficulty: 'beginner', movementPattern: 'Izolacja — rotacja zewnętrzna',
    primaryMuscles: ['rear_delts'], secondaryMuscles: ['upper_back'], stabilizerMuscles: [],
    instructions: 'Lina na wysokości twarzy, przyciąganie do twarzy z rozciągnięciem łokci na boki.',
    tips: 'Świetne na zdrowie barków — warto trzymać w każdym planie push.', contraindications: '', rehabSafe: true, tags: ['prehab', 'zdrowie barków'],
  }),
  ex({
    id: 'gym-barbell-curl', name: 'Uginanie ramion ze sztangą', aliases: ['Barbell curl'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Sztanga'], difficulty: 'beginner', movementPattern: 'Izolacja — zgięcie łokcia',
    primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], stabilizerMuscles: [],
    instructions: 'Łokcie przy tułowiu, uginanie bez pomocy bioder, pełny zakres.', tips: 'Kontroluj fazę opuszczania — to ona buduje masę.',
    contraindications: '', rehabSafe: false, tags: ['izolacja'],
  }),
  ex({
    id: 'gym-deadlift', name: 'Martwy ciąg klasyczny', aliases: ['Deadlift'],
    sport: 'Siłownia', category: 'Pull', equipment: ['Sztanga'], difficulty: 'advanced', movementPattern: 'Zawias biodrowy (hip hinge)',
    primaryMuscles: ['glutes', 'hamstrings', 'lower_back'], secondaryMuscles: ['quads', 'upper_back'], stabilizerMuscles: ['abs', 'forearms'],
    instructions: 'Sztanga blisko piszczeli, neutralny kręgosłup, wyprost bioder i kolan jednocześnie.',
    tips: 'Myśl "pchnij podłogę nogami", nie "podnoszę sztangę plecami".', contraindications: 'Ostry ból lędźwi, niekontrolowana technika hip hinge.', rehabSafe: false, tags: ['siła', 'klasyk', 'full body'],
  }),

  // ── SIŁOWNIA — LEGS ─────────────────────────────────────────
  ex({
    id: 'gym-back-squat', name: 'Przysiad ze sztangą na plecach', aliases: ['Back squat'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Sztanga'], difficulty: 'advanced', movementPattern: 'Przysiad',
    primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'adductors'], stabilizerMuscles: ['abs', 'lower_back'],
    instructions: 'Sztanga na górnych trapezach, zejście z kontrolą do równoległości lub niżej, wyprost przez pięty.',
    tips: 'Kolana w linii palców stóp, klatka wysoko przez cały ruch.', contraindications: 'Ostry ból kolana/lędźwi przy obciążeniu osiowym.', rehabSafe: false, tags: ['siła', 'klasyk', 'full body'],
  }),
  ex({
    id: 'gym-leg-press', name: 'Wyciskanie nóg na maszynie', aliases: ['Leg press'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Przysiad (prowadzony)',
    primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings'], stabilizerMuscles: [],
    instructions: 'Stopy na szerokość barków, zejście do 90° w kolanie, wyprost bez blokowania stawu.',
    tips: 'Bezpieczna alternatywa przysiadu przy problemach z równowagą/lędźwiami.', contraindications: '', rehabSafe: true, tags: ['masa', 'alternatywa'],
  }),
  ex({
    id: 'gym-romanian-deadlift', name: 'Martwy ciąg rumuński', aliases: ['RDL', 'Romanian deadlift'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Sztanga', 'Hantle'], difficulty: 'intermediate', movementPattern: 'Zawias biodrowy (hip hinge)',
    primaryMuscles: ['hamstrings', 'glutes'], secondaryMuscles: ['lower_back'], stabilizerMuscles: ['abs', 'forearms'],
    instructions: 'Lekkie ugięcie kolan, biodra do tyłu, sztanga ślizga się po nogach, wyprost przez pośladki.',
    tips: 'Rozciągnięcie hamstringów to sygnał stopu — nie zaokrąglaj dolnego odcinka pleców.', contraindications: 'Ostry ból lędźwi.', rehabSafe: false, tags: ['hipertrofia', 'mięśnie dwustawowe'],
  }),
  ex({
    id: 'gym-bulgarian-split-squat', name: 'Przysiad bułgarski', aliases: ['Bulgarian split squat'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Hantle'], difficulty: 'intermediate', movementPattern: 'Przysiad jednonóż',
    primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['hamstrings', 'adductors'], stabilizerMuscles: ['abs'],
    instructions: 'Tylna stopa na podwyższeniu, zejście pionowo w dół na przedniej nodze.',
    tips: 'Świetne narzędzie do wykrywania asymetrii sił między nogami.', contraindications: 'Niestabilność kolana.', rehabSafe: false, tags: ['jednonóż', 'stabilizacja'],
  }),
  ex({
    id: 'gym-leg-curl', name: 'Uginanie nóg leżąc', aliases: ['Leg curl'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Izolacja — zgięcie kolana',
    primaryMuscles: ['hamstrings'], secondaryMuscles: ['calves'], stabilizerMuscles: [],
    instructions: 'Uginanie podudzia do maksymalnego skrócenia bez odrywania bioder.', tips: 'Powolny powrót — ekscentryka chroni przed urazami hamstringu.',
    contraindications: '', rehabSafe: true, tags: ['izolacja', 'prehab'],
  }),
  ex({
    id: 'gym-leg-extension', name: 'Wyprosty nóg na maszynie', aliases: ['Leg extension'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Maszyna'], difficulty: 'beginner', movementPattern: 'Izolacja — wyprost kolana',
    primaryMuscles: ['quads'], secondaryMuscles: [], stabilizerMuscles: [],
    instructions: 'Wyprost podudzia do pełnego zakresu, kontrolowany powrót.', tips: 'Dobre po urazie kolana w fazie kontrolowanego wzmacniania.',
    contraindications: 'Ostry stan zapalny rzepki — konsultacja fizjoterapeuty.', rehabSafe: true, tags: ['izolacja', 'rehab'],
  }),
  ex({
    id: 'gym-calf-raise', name: 'Wspięcia na piętach stojąc', aliases: ['Standing calf raise'],
    sport: 'Siłownia', category: 'Legs', equipment: ['Maszyna', 'Własna waga'], difficulty: 'beginner', movementPattern: 'Izolacja — zgięcie podeszwowe',
    primaryMuscles: ['calves'], secondaryMuscles: [], stabilizerMuscles: ['ankle'],
    instructions: 'Pełny zakres — od maksymalnego rozciągnięcia pięty do pełnego wspięcia na palcach.', tips: 'Tempo > ciężar — łydki lubią wolne, pełne powtórzenia.',
    contraindications: '', rehabSafe: true, tags: ['izolacja'],
  }),

  // ── SIŁOWNIA — FULL BODY / CORE ─────────────────────────────
  ex({
    id: 'gym-plank', name: 'Deska (plank)', aliases: ['Plank'],
    sport: 'Siłownia', category: 'Full Body', equipment: ['Własna waga'], difficulty: 'beginner', movementPattern: 'Stabilizacja tułowia',
    primaryMuscles: ['abs'], secondaryMuscles: ['obliques', 'lower_back'], stabilizerMuscles: ['front_delts'],
    instructions: 'Przedramiona i palce stóp w podłodze, ciało w linii od głowy do pięt, spięty brzuch.',
    tips: 'Nie zapadaj się w lędźwiach — wyobraź sobie podkręcanie miednicy.', contraindications: '', rehabSafe: true, tags: ['core', 'stabilizacja'],
  }),
  ex({
    id: 'gym-farmers-walk', name: 'Marsz farmera', aliases: ["Farmer's walk"],
    sport: 'Siłownia', category: 'Full Body', equipment: ['Hantle', 'Kettlebell'], difficulty: 'intermediate', movementPattern: 'Lokomocja obciążona',
    primaryMuscles: ['forearms', 'upper_back'], secondaryMuscles: ['abs', 'glutes'], stabilizerMuscles: ['quads', 'calves'],
    instructions: 'Ciężary po bokach, marsz z wyprostowanymi barkami i napiętym tułowiem.', tips: 'Świetne dla siły chwytu i stabilizacji całego ciała naraz.',
    contraindications: '', rehabSafe: false, tags: ['siła funkcjonalna', 'full body'],
  }),

  // ── BIEGANIE — sesje jako "ćwiczenia" referencyjne ──────────
  ex({
    id: 'run-easy', name: 'Bieg spokojny (easy run)', aliases: ['Easy run'],
    sport: 'Bieganie', category: 'Easy Run', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Bieg ciągły, niska intensywność',
    primaryMuscles: ['quads', 'calves', 'hamstrings'], secondaryMuscles: ['glutes', 'hip_flexors'], stabilizerMuscles: ['abs', 'ankle'],
    instructions: 'Tempo konwersacyjne, tętno w strefie 2, skup się na lekkim, ekonomicznym kroku.',
    tips: 'Większość objętości tygodniowej powinna być w tym tempie.', contraindications: '', rehabSafe: false, tags: ['baza', 'regeneracja aktywna'],
  }),
  ex({
    id: 'run-intervals', name: 'Interwały', aliases: ['Interwały biegowe'],
    sport: 'Bieganie', category: 'Interwały', equipment: ['Brak / teren'], difficulty: 'advanced', movementPattern: 'Bieg przerywany, wysoka intensywność',
    primaryMuscles: ['quads', 'calves'], secondaryMuscles: ['glutes', 'hamstrings'], stabilizerMuscles: ['abs', 'ankle'],
    instructions: 'Odcinki w wysokiej intensywności (np. 400-1000 m) przeplatane truchtem/odpoczynkiem.',
    tips: 'Rozgrzewka min. 15 min przed pierwszym odcinkiem.', contraindications: 'Świeży uraz mięśniowy nóg.', rehabSafe: false, tags: ['vo2max', 'prędkość'],
  }),
  ex({
    id: 'run-tempo', name: 'Bieg tempowy', aliases: ['Tempo run'],
    sport: 'Bieganie', category: 'Tempo', equipment: ['Brak / teren'], difficulty: 'intermediate', movementPattern: 'Bieg ciągły, próg mleczanowy',
    primaryMuscles: ['quads', 'calves', 'hamstrings'], secondaryMuscles: ['glutes'], stabilizerMuscles: ['abs'],
    instructions: 'Tempo "komfortowo trudne" — ok. tętna progowego, utrzymywane 20-40 min.', tips: 'Nie powinieneś móc swobodnie rozmawiać w tym tempie.',
    contraindications: '', rehabSafe: false, tags: ['próg', 'wytrzymałość'],
  }),
  ex({
    id: 'run-long', name: 'Długi bieg (long run)', aliases: ['Long run'],
    sport: 'Bieganie', category: 'Long Run', equipment: ['Brak / teren'], difficulty: 'intermediate', movementPattern: 'Bieg ciągły, duża objętość',
    primaryMuscles: ['quads', 'calves', 'hamstrings'], secondaryMuscles: ['glutes', 'hip_flexors'], stabilizerMuscles: ['abs', 'ankle'],
    instructions: 'Najdłuższy bieg tygodnia, tempo łagodne, nawodnienie i odżywienie w trakcie przy >90 min.',
    tips: 'Zwiększaj dystans long runu o max ~10% tygodniowo.', contraindications: '', rehabSafe: false, tags: ['baza', 'wytrzymałość'],
  }),
  ex({
    id: 'run-recovery', name: 'Bieg regeneracyjny', aliases: ['Recovery run'],
    sport: 'Bieganie', category: 'Regeneracyjny', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Bieg ciągły, bardzo niska intensywność',
    primaryMuscles: ['calves', 'quads'], secondaryMuscles: [], stabilizerMuscles: ['abs'],
    instructions: 'Krótki, bardzo spokojny bieg dzień po cięższym treningu, ma poprawić przepływ krwi.',
    tips: 'Jeśli czujesz potrzebę przyspieszenia — to znak, że było zbyt szybko.', contraindications: '', rehabSafe: true, tags: ['regeneracja aktywna'],
  }),
  ex({
    id: 'run-hills', name: 'Podbiegi', aliases: ['Hill repeats'],
    sport: 'Bieganie', category: 'Podbiegi', equipment: ['Brak / teren'], difficulty: 'advanced', movementPattern: 'Bieg pod górę, siła + moc',
    primaryMuscles: ['glutes', 'quads', 'calves'], secondaryMuscles: ['hamstrings'], stabilizerMuscles: ['abs'],
    instructions: 'Odcinki pod górę w wysokiej intensywności, zejście jako odpoczynek trucht/marsz.',
    tips: 'Buduje siłę biegową bez nadmiernego obciążania stawów jak sprint po płaskim.', contraindications: 'Ból ścięgna Achillesa.', rehabSafe: false, tags: ['siła biegowa', 'moc'],
  }),

  // ── WSPINACZKA ───────────────────────────────────────────────
  ex({
    id: 'climb-boulder', name: 'Sesja bulderowa', aliases: ['Boulder session'],
    sport: 'Wspinaczka', category: 'Boulder', equipment: ['Chwyty / boulder wall'], difficulty: 'intermediate', movementPattern: 'Wspinanie — siła + moc',
    primaryMuscles: ['forearms', 'lats', 'biceps'], secondaryMuscles: ['abs', 'front_delts'], stabilizerMuscles: ['glutes', 'quads'],
    instructions: 'Krótkie, intensywne drogi (boulder) z pełnym odpoczynkiem między próbami.',
    tips: 'Jakość ruchu > liczba prób — odpoczywaj w pełni między próbami na limicie.', contraindications: 'Ostry stan zapalny bloczków palców.', rehabSafe: false, tags: ['siła', 'moc'],
  }),
  ex({
    id: 'climb-rope', name: 'Sesja na linie', aliases: ['Lina', 'Rope climbing'],
    sport: 'Wspinaczka', category: 'Lina', equipment: ['Liny wspinaczkowe'], difficulty: 'intermediate', movementPattern: 'Wspinanie — wytrzymałość',
    primaryMuscles: ['forearms', 'lats'], secondaryMuscles: ['biceps', 'abs'], stabilizerMuscles: ['calves', 'quads'],
    instructions: 'Dłuższe drogi wymagające zarządzania energią i odpoczynkiem na trasie.',
    tips: 'Skup się na płynnym oddechu i odpoczynku na nogach, nie na rękach.', contraindications: '', rehabSafe: false, tags: ['wytrzymałość'],
  }),
  ex({
    id: 'climb-technique', name: 'Trening techniki', aliases: ['Technika'],
    sport: 'Wspinaczka', category: 'Technika', equipment: ['Chwyty / boulder wall'], difficulty: 'beginner', movementPattern: 'Wspinanie — technika i równowaga',
    primaryMuscles: ['quads', 'glutes'], secondaryMuscles: ['abs', 'forearms'], stabilizerMuscles: ['calves'],
    instructions: 'Łatwe drogi z naciskiem na footwork, biodra blisko ściany, płynne przejścia.',
    tips: 'Wspinaj się "na nogach" — ręce powinny tylko balansować.', contraindications: '', rehabSafe: true, tags: ['technika', 'footwork'],
  }),
  ex({
    id: 'climb-finger-strength', name: 'Siła palców (hangboard)', aliases: ['Hangboard', 'Fingerboard'],
    sport: 'Wspinaczka', category: 'Siła palców', equipment: ['Chwyty / boulder wall'], difficulty: 'advanced', movementPattern: 'Izolacja — chwyt izometryczny',
    primaryMuscles: ['forearms'], secondaryMuscles: ['biceps'], stabilizerMuscles: ['lats'],
    instructions: 'Izometryczne wisy na wybranych chwytach, z pełną rozgrzewką palców przed sesją.',
    tips: 'Bardzo wysokie ryzyko urazu bloczków — nigdy bez rozgrzewki.', contraindications: 'Ból/obrzęk bloczka, świeży uraz palca.', rehabSafe: false, tags: ['siła maksymalna', 'ryzyko urazu'],
  }),
  ex({
    id: 'climb-endurance', name: 'Wytrzymałość (laps / 4x4)', aliases: ['ARC training', '4x4'],
    sport: 'Wspinaczka', category: 'Wytrzymałość', equipment: ['Chwyty / boulder wall'], difficulty: 'intermediate', movementPattern: 'Wspinanie — wytrzymałość lokalna',
    primaryMuscles: ['forearms'], secondaryMuscles: ['lats', 'abs'], stabilizerMuscles: ['quads'],
    instructions: 'Powtarzane przejścia z krótkim odpoczynkiem, celowane "napompowanie" przedramion.',
    tips: 'Trenuj to po sile, nie przed — inaczej zepsujesz jakość treningu siłowego.', contraindications: '', rehabSafe: false, tags: ['wytrzymałość lokalna'],
  }),
  ex({
    id: 'climb-mobility', name: 'Mobilność wspinaczkowa (biodra/barki)', aliases: ['Climbing mobility'],
    sport: 'Wspinaczka', category: 'Mobilność wspinaczkowa', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność stawowa',
    primaryMuscles: ['hip_flexors', 'adductors'], secondaryMuscles: ['front_delts', 'rear_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Sekwencja rozciągania bioder (high step, frog stretch) i obręczy barkowej.', tips: 'Robić w dni bez wspinania, jako uzupełnienie.',
    contraindications: '', rehabSafe: true, tags: ['mobilność', 'prehab'],
  }),

  // ── MOBILNOŚĆ ────────────────────────────────────────────────
  ex({
    id: 'mob-90-90-hip', name: 'Rotacje bioder 90/90', aliases: ['90/90 hip switch'],
    sport: 'Mobilność', category: 'Biodra', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność stawu biodrowego',
    primaryMuscles: ['hip_flexors', 'adductors'], secondaryMuscles: ['glutes'], stabilizerMuscles: ['abs'],
    instructions: 'Siad z obiema nogami zgiętymi 90°, kontrolowana rotacja bioder na boki.', tips: 'Trzymaj tułów pionowo, ruch ma iść z bioder, nie z pleców.',
    contraindications: 'Ostry ból stawu biodrowego.', rehabSafe: true, tags: ['biodra', 'rotacja'],
  }),
  ex({
    id: 'mob-shoulder-clo', name: 'Krążenia ramion z taśmą (shoulder CARs)', aliases: ['Shoulder CARs'],
    sport: 'Mobilność', category: 'Barki', equipment: ['Guma oporowa', 'Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność stawu ramiennego',
    primaryMuscles: ['front_delts', 'rear_delts'], secondaryMuscles: ['upper_back'], stabilizerMuscles: ['abs'],
    instructions: 'Pełne, kontrolowane okrężne ruchy ramieniem w maksymalnym bezbolesnym zakresie.',
    tips: 'Wolno i kontrolowanie — to ćwiczenie ma na celu kontrolę zakresu, nie tylko jego zwiększenie.', contraindications: '', rehabSafe: true, tags: ['barki', 'CARs'],
  }),
  ex({
    id: 'mob-cat-cow', name: 'Kot-wielbłąd (cat-cow)', aliases: ['Cat-cow'],
    sport: 'Mobilność', category: 'Kręgosłup', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność odcinkowa kręgosłupa',
    primaryMuscles: ['lower_back'], secondaryMuscles: ['abs', 'upper_back'], stabilizerMuscles: [],
    instructions: 'Na czworakach, alternujące zaokrąglanie i wyginanie kręgosłupa w rytm oddechu.', tips: 'Świetna rozgrzewka przed treningiem siłowym dolnej części ciała.',
    contraindications: '', rehabSafe: true, tags: ['kręgosłup', 'rozgrzewka'],
  }),
  ex({
    id: 'mob-wrist-stretch', name: 'Mobilizacja nadgarstków', aliases: ['Wrist mobility'],
    sport: 'Mobilność', category: 'Nadgarstki', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność stawu nadgarstkowego',
    primaryMuscles: ['wrist'], secondaryMuscles: ['forearms'], stabilizerMuscles: [],
    instructions: 'Krążenia i zgięcia/wyprosty nadgarstka w pełnym, kontrolowanym zakresie.', tips: 'Warto robić przed treningiem z dużym naciskiem na nadgarstki (push, wspinanie).',
    contraindications: 'Ostry uraz nadgarstka.', rehabSafe: true, tags: ['nadgarstki', 'rozgrzewka'],
  }),
  ex({
    id: 'mob-ankle-clo', name: 'Mobilizacja stawu skokowego', aliases: ['Ankle mobility'],
    sport: 'Mobilność', category: 'Kostki', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Mobilność stawu skokowego',
    primaryMuscles: ['ankle'], secondaryMuscles: ['calves'], stabilizerMuscles: [],
    instructions: 'Przysiad z piętami na podłodze lub "knee to wall" do zwiększenia zgięcia grzbietowego stopy.',
    tips: 'Kluczowe dla głębokiego przysiadu i biegania bez kompensacji w kolanie.', contraindications: '', rehabSafe: true, tags: ['kostki', 'przysiad'],
  }),
  ex({
    id: 'mob-world-greatest-stretch', name: 'Mobilność full body (world\'s greatest stretch)', aliases: ["World's greatest stretch"],
    sport: 'Mobilność', category: 'Full Body', equipment: ['Brak / teren'], difficulty: 'intermediate', movementPattern: 'Mobilność wielostawowa',
    primaryMuscles: ['hip_flexors', 'adductors'], secondaryMuscles: ['lower_back', 'front_delts'], stabilizerMuscles: ['abs'],
    instructions: 'Wykrok, rotacja tułowia z wyciągnięciem ramienia w górę, przeplatane stronami.', tips: 'Świetne jako kompleksowa rozgrzewka przed pełnym treningiem.',
    contraindications: '', rehabSafe: true, tags: ['rozgrzewka', 'full body'],
  }),

  // ── REHABILITACJA ────────────────────────────────────────────
  ex({
    id: 'rehab-knee-terminal-extension', name: 'Wyprosty kolana z gumą (terminal knee extension)', aliases: ['TKE'],
    sport: 'Rehabilitacja', category: 'Kolano', equipment: ['Guma oporowa'], difficulty: 'beginner', movementPattern: 'Rehab — wyprost kolana',
    primaryMuscles: ['quads', 'knee'], secondaryMuscles: [], stabilizerMuscles: ['glutes'],
    instructions: 'Guma za kolanem, lekkie ugięcie i pełny, kontrolowany wyprost stawu.', tips: 'Klasyczne ćwiczenie po urazach więzadeł/łąkotki — konsultuj progresję z fizjoterapeutem.',
    contraindications: 'Ostry obrzęk kolana, bezpośrednio po zabiegu — zgodnie z planem fizjoterapeuty.', rehabSafe: true, tags: ['kolano', 'prehab/rehab'],
  }),
  ex({
    id: 'rehab-shoulder-external-rotation', name: 'Rotacja zewnętrzna barku z gumą', aliases: ['Shoulder ER'],
    sport: 'Rehabilitacja', category: 'Bark', equipment: ['Guma oporowa'], difficulty: 'beginner', movementPattern: 'Rehab — rotacja stożka rotatorów',
    primaryMuscles: ['rear_delts'], secondaryMuscles: ['upper_back'], stabilizerMuscles: ['forearms'],
    instructions: 'Łokieć przy tułowiu zgięty 90°, rotacja przedramienia na zewnątrz pod kontrolą.', tips: 'Niski ciężar, wysoka jakość ruchu — to praca na stożku rotatorów, nie na siłę.',
    contraindications: 'Ostry stan zapalny stożka rotatorów bez konsultacji.', rehabSafe: true, tags: ['bark', 'stożek rotatorów'],
  }),
  ex({
    id: 'rehab-elbow-wrist-curls', name: 'Uginanie nadgarstka z hantlą (tenisowy/golfowy łokieć)', aliases: ['Wrist curl rehab'],
    sport: 'Rehabilitacja', category: 'Łokieć', equipment: ['Hantle'], difficulty: 'beginner', movementPattern: 'Rehab — przedramię/łokieć',
    primaryMuscles: ['forearms', 'elbow'], secondaryMuscles: [], stabilizerMuscles: [],
    instructions: 'Bardzo mały ciężar, pełen zakres zgięcia/wyprostu nadgarstka z naciskiem na fazę ekscentryczną.',
    tips: 'Ekscentryka jest kluczowa w rehabilitacji entezopatii łokcia.', contraindications: 'Ostry, ostry ból przy minimalnym obciążeniu — skonsultuj się.', rehabSafe: true, tags: ['łokieć', 'ekscentryka'],
  }),
  ex({
    id: 'rehab-bird-dog', name: 'Bird-dog (lędźwie)', aliases: ['Bird dog'],
    sport: 'Rehabilitacja', category: 'Lędźwie', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Rehab — stabilizacja lędźwiowo-miedniczna',
    primaryMuscles: ['lower_back', 'abs'], secondaryMuscles: ['glutes'], stabilizerMuscles: ['upper_back'],
    instructions: 'Na czworakach, wyprost przeciwstawnej ręki i nogi z neutralnym kręgosłupem.', tips: 'Jakość > zakres — miednica nie powinna się przechylać.',
    contraindications: '', rehabSafe: true, tags: ['lędźwie', 'core', 'stabilizacja'],
  }),
  ex({
    id: 'rehab-ankle-alphabet', name: 'Alfabet stopą (staw skokowy)', aliases: ['Ankle alphabet'],
    sport: 'Rehabilitacja', category: 'Skokowy', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Rehab — staw skokowy',
    primaryMuscles: ['ankle'], secondaryMuscles: ['calves'], stabilizerMuscles: [],
    instructions: 'Rysowanie stopą liter alfabetu w powietrzu, w pełnym bezbolesnym zakresie.', tips: 'Typowe wczesne ćwiczenie po skręceniu stawu skokowego.',
    contraindications: 'Ostra faza urazu — zgodnie z planem fizjoterapeuty.', rehabSafe: true, tags: ['skokowy', 'wczesna faza'],
  }),
  ex({
    id: 'rehab-wrist-extensor-stretch', name: 'Rozciąganie wyprostników nadgarstka', aliases: ['Wrist extensor stretch'],
    sport: 'Rehabilitacja', category: 'Nadgarstek', equipment: ['Brak / teren'], difficulty: 'beginner', movementPattern: 'Rehab — rozciąganie przedramienia',
    primaryMuscles: ['forearms', 'wrist'], secondaryMuscles: [], stabilizerMuscles: [],
    instructions: 'Ramię wyprostowane, dłoń zgięta w nadgarstku, delikatne dociągnięcie drugą ręką.', tips: 'Krótkie, częste serie (np. 5x30s dziennie) są efektywniejsze niż rzadkie długie.',
    contraindications: '', rehabSafe: true, tags: ['nadgarstek', 'rozciąganie'],
  }),
];

export function exercisesBySport(sport: SportKey): ExerciseDef[] {
  return EXERCISE_CATALOG.filter((e) => e.sport === sport);
}

export function findExercise(id: string): ExerciseDef | undefined {
  return EXERCISE_CATALOG.find((e) => e.id === id);
}
