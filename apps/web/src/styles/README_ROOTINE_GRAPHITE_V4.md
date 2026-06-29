# Rootine OS — Graphite Cool Ice v4 CSS package

## Co zostało zmienione

Ten pakiet zawiera te same pliki CSS, które zostały przesłane, ale z dopisanym i uporządkowanym systemowym override’em **Graphite Cool Ice v4**.

Najważniejsze zmiany są w:

- `rootine-theme.css` — główny kontrakt wizualny, powinien być importowany jako ostatni CSS w aplikacji.
- `styles.css` — zawiera kopię końcowego override’u jako zabezpieczenie, gdyby aplikacja importowała `styles.css` po modułowych plikach CSS.

Pozostałe pliki modułowe (`travel.css`, `work.css`, `desk.css`, `health.css`, `notes.css`, `nutrition.css`, `sport.css`) zostały zachowane pod tymi samymi nazwami, żeby można było podmienić cały zestaw bez zmiany importów.

## Wymagany import order

Najbezpieczniejszy porządek:

```ts
import './styles.css';
import './travel.css';
import './work.css';
import './desk.css';
import './health.css';
import './notes.css';
import './nutrition.css';
import './sport.css';
import './rootine-theme.css';
```

`rootine-theme.css` musi być ostatni, ponieważ scala cały interfejs do jednego języka wizualnego.

## Główna zasada wdrożonej korekty

Nie kopiujemy stylu modala dosłownie na wszystkie elementy. Zamiast tego aplikacja ma teraz wyraźną drabinę powierzchni:

1. App backdrop — najciemniejszy.
2. Chrome / topbar / sidebar — ciemny graphite z lekkim światłem.
3. Page workspace — ciemna przestrzeń robocza.
4. Major panels — jaśniejsze, wyraźnie podniesione panele.
5. Tiles / calendar cells / rows — kafle lżejsze od inputów.
6. Fields — najciemniejsza warstwa interaktywna.
7. Ice accent — tylko aktywne, wybrane, focus, progress i primary CTA.

## Dlaczego patch jest też w styles.css

W idealnej architekturze wystarczyłby sam `rootine-theme.css`. Ponieważ w obecnych plikach jest dużo lokalnych nadpisań i nie mamy pewności co do kolejności importów w aplikacji, ten sam końcowy blok został dodany także na końcu `styles.css` jako zabezpieczenie.

Docelowo można usunąć kopię ze `styles.css`, jeśli potwierdzicie, że `rootine-theme.css` jest zawsze importowany ostatni.
