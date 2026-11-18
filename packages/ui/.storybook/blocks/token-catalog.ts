export interface TokenEntry {
  readonly name: string;
  readonly origin: string;
  readonly use: string;
  readonly avoid: string;
}

const SOURCE_ONLY = 'tylko jako źródło dla znaczeń';
const NOT_DESCRIBED = 'zakres użycia nie jest opisany w zatwierdzonych tokenach';
const NOT_DIRECT = 'bezpośrednio w komponentach';

export const RAW_COLORS: readonly TokenEntry[] = [
  { name: '--raw-white', origin: 'R01.1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-50', origin: 'R01.1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-100', origin: 'R01.1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-200', origin: 'R01.1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-300', origin: 'A2, R01.5', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-400', origin: 'R01.1, K2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-600', origin: 'R01.1, K2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-gray-900', origin: 'R01.1, K2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-blue-100', origin: 'R01.1, K1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-blue-600', origin: 'R01.1, K1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-blue-700', origin: 'R01.1, K1', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-green-700', origin: 'K2, R01.2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-red-700', origin: 'K2, R01.2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  {
    name: '--raw-red-800',
    origin: 'propozycja z PR L, zatwierdzona przez właściciela produktu, 2026-11-18 (jeden stopień ciemniej niż --raw-red-700, wartość ze skali czerwieni Tailwinda)',
    use: SOURCE_ONLY,
    avoid: NOT_DIRECT,
  },
  { name: '--raw-violet-100', origin: 'R01.2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
  { name: '--raw-violet-700', origin: 'R01.2', use: SOURCE_ONLY, avoid: NOT_DIRECT },
];

export const MEANING_COLORS: readonly TokenEntry[] = [
  { name: '--background', origin: 'R01.1', use: 'tło strony', avoid: 'tło kart' },
  { name: '--card', origin: 'R01.1, A2', use: 'karta konta, panel', avoid: 'tło strony' },
  { name: '--foreground', origin: 'R01.1', use: 'tekst podstawowy', avoid: 'tekst pomocniczy' },
  { name: '--card-foreground', origin: 'R01.1', use: 'tekst podstawowy', avoid: 'tekst pomocniczy' },
  {
    name: '--muted-foreground',
    origin: 'K2, R01.3',
    use: 'notki, nagłówki tabeli, podpisy',
    avoid: 'ważne treści, kwoty',
  },
  { name: '--muted', origin: 'R01.1', use: 'przycisk drugoplanowy, hover', avoid: 'separacja kart' },
  {
    name: '--muted-hover',
    origin: 'propozycja z PR E, zatwierdzona przez właściciela produktu, 2026-11-17',
    use: 'hover przycisku drugoplanowego',
    avoid: 'stan spoczynku',
  },
  {
    name: '--destructive-foreground',
    origin: 'propozycja z PR E, zatwierdzona przez właściciela produktu, 2026-11-17',
    use: 'tekst na przycisku usuwającym (na --destructive)',
    avoid: '—',
  },
  {
    name: '--destructive-hover',
    origin: 'propozycja z PR L, zatwierdzona przez właściciela produktu, 2026-11-18',
    use: 'hover przycisku usuwającego (tło pod --destructive-foreground, 8,31:1)',
    avoid: 'stan spoczynku',
  },
  {
    name: '--overlay',
    origin: 'nowy token znaczeniowy zatwierdzony przez właściciela produktu, 2026-11-18; wartość to --raw-gray-900 z krytością 60% (krycie 60%: propozycja z PR L, zatwierdzona przez właściciela produktu, 2026-11-18)',
    use: 'przesłona za oknem Dialog i ConfirmDialog',
    avoid: 'tło treści; tekst bezpośrednio na przesłonie',
  },
  { name: '--form-surface', origin: 'R01.5', use: 'tło rozwijanego formularza', avoid: 'tło strony' },
  {
    name: '--primary',
    origin: 'K1, R01.1',
    use: 'przycisk główny, pasek nagłówka, zaznaczenie',
    avoid: 'tekst stanu finansowego',
  },
  { name: '--primary-foreground', origin: 'K1, R01.1', use: 'przycisk główny, pasek nagłówka, zaznaczenie (tekst na --primary)', avoid: '—' },
  { name: '--primary-hover', origin: 'R01.6', use: 'hover przycisku głównego', avoid: 'stan spoczynku' },
  { name: '--ring', origin: 'audyt', use: 'fokus (pierścień 2 px)', avoid: 'dekoracja' },
  {
    name: '--input',
    origin: 'A2, R01.5',
    use: 'ramka pól i checkboxa',
    avoid: 'separatory kart; pola bezpośrednio na tle strony',
  },
  {
    name: '--border',
    origin: 'A2, R01.5',
    use: 'ramka kart, panelu, linie wierszy',
    avoid: 'niesienie informacji o stanie',
  },
  {
    name: '--income',
    origin: 'K2, R01.2',
    use: 'kwota wpływu, dodatnia reszta',
    avoid: 'bez znaku "+" lub etykiety (A3)',
  },
  {
    name: '--expense',
    origin: 'K2, R01.2',
    use: 'kwota wydatku, ujemna reszta, błąd',
    avoid: 'bez znaku lub etykiety (A3)',
  },
  {
    name: '--destructive',
    origin: 'K2, R01.2',
    use: 'kwota wydatku, ujemna reszta, błąd',
    avoid: 'bez znaku lub etykiety (A3)',
  },
];

export const COMPONENT_COLORS: readonly TokenEntry[] = [
  {
    name: '--badge-shared-bg',
    origin: 'R01.2 (P3: wygląd z makiety)',
    use: 'plakietka "wspólne" (tło)',
    avoid: 'akcje',
  },
  { name: '--badge-shared-fg', origin: 'R01.2 (P3: wygląd z makiety)', use: 'plakietka "wspólne" (tekst)', avoid: 'akcje' },
  { name: '--badge-personal-bg', origin: 'R01.2', use: 'plakietka "osobiste" (tło)', avoid: 'akcje' },
  { name: '--badge-personal-fg', origin: 'R01.2', use: 'plakietka "osobiste" (tekst)', avoid: 'akcje' },
];

export interface TypeRole {
  readonly name: string;
  readonly origin: string;
  readonly use: string;
  readonly avoid: string;
  readonly sample: string;
}

export const FONT_SIZES: readonly TypeRole[] = [
  {
    name: '--font-size-sm',
    origin: 'R01.3',
    use: 'tabela, etykiety, notki, plakietki, nagłówki tabeli',
    avoid: 'rozmiary 12 i 13 px',
    sample: 'Etykieta pola, notka, plakietka',
  },
  {
    name: '--font-size-base',
    origin: 'R01.3',
    use: 'tekst, nazwa konta',
    avoid: 'rozmiar 18 px',
    sample: 'Konto wspólne (przykład)',
  },
  {
    name: '--font-size-lg',
    origin: 'R01.3',
    use: 'nagłówki sekcji, miesiąc',
    avoid: 'rozmiar 18 px',
    sample: 'Listopad 2026 (przykład)',
  },
  {
    name: '--font-size-xl',
    origin: 'R01.3',
    use: 'kwota "ile zostanie"',
    avoid: 'inne treści niż wynik',
    sample: '3 975,50 zł (przykład)',
  },
];

export const FONT_WEIGHTS: readonly TokenEntry[] = [
  { name: '--font-weight-normal', origin: 'R01.3', use: NOT_DESCRIBED, avoid: '—' },
  { name: '--font-weight-semibold', origin: 'R01.3', use: NOT_DESCRIBED, avoid: '—' },
  { name: '--font-weight-bold', origin: 'R01.3', use: 'tylko kwota wyniku', avoid: 'pozostałe treści' },
];

export const SPACE_SCALE: readonly string[] = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-6',
  '--space-8',
  '--space-12',
];

export const SPACE_MEANINGS: readonly TokenEntry[] = [
  {
    name: '--space-label-field',
    origin: 'decyzja właściciela 2026-11-17 (4 px)',
    use: 'etykieta, pole, podpowiedź i błąd w jednym polu formularza (Field)',
    avoid: 'odstęp między polami (to --space-between-fields)',
  },
  {
    name: '--space-within-group',
    origin: 'R01.4',
    use: 'przyciski obok siebie, element obok elementu',
    avoid: 'między polami formularza',
  },
  { name: '--space-between-fields', origin: 'R01.5', use: 'pola formularza', avoid: '—' },
  {
    name: '--space-between-groups',
    origin: 'R01.4',
    use: 'między kartami (wartość wspólna z --space-panel)',
    avoid: 'wartości spoza skali (2, 6, 14 px)',
  },
  { name: '--space-panel', origin: 'R01.4', use: 'padding panelu i karty', avoid: 'wartości spoza skali (2, 6, 14 px)' },
  {
    name: '--space-card-gap',
    origin: 'decyzja właściciela 2026-11-17 (12 px, jak odstęp w nagłówku panelu w makiecie)',
    use: 'odstęp między częściami wewnątrz karty (Card)',
    avoid: 'padding karty (to --space-panel)',
  },
  { name: '--space-section', origin: 'R01.4', use: 'między sekcjami strony', avoid: 'wartości spoza skali (2, 6, 14 px)' },
];

export const SHAPE_TOKENS: readonly TokenEntry[] = [
  { name: '--radius', origin: 'R01.5', use: 'pola, przyciski (Tailwind: rounded-control)', avoid: 'karty' },
  { name: '--radius-surface', origin: 'R01.5', use: 'karty, panel, formularz (Tailwind: rounded-card)', avoid: 'plakietki' },
  { name: '--radius-badge', origin: 'R01.5', use: 'plakietki (Tailwind: rounded-pill)', avoid: 'karty' },
  {
    name: '--control-height',
    origin: 'decyzja właściciela 2026-11-17 (36 px); token zatwierdzony przez właściciela produktu, 2026-11-17',
    use: 'wysokość przycisków i pól (Tailwind: h-control, size-control)',
    avoid: 'wysokości spoza skali',
  },
  {
    name: '--checkbox-size',
    origin: 'zatwierdzone przez właściciela produktu, 2026-11-17 (pole 20 px, cel kliknięcia 36 px = --control-height)',
    use: 'wymiar pola Checkbox (Tailwind: size-checkbox)',
    avoid: 'wysokość kontrolek (to --control-height)',
  },
  { name: '--shadow-card', origin: 'A2', use: 'brak cienia, separacja ramką --border', avoid: 'cień jako jedyny separator' },
];

export const MOTION_TOKENS: readonly TokenEntry[] = [
  {
    name: '--duration-feedback',
    origin: 'R01.6 (P5, wartość z propozycji, zatwierdzona)',
    use: 'hover; potwierdzenie zapisu widoczne ok. 3 s',
    avoid: 'animacje dekoracyjne',
  },
];
