import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SCREEN_TITLES, installNavigationGate } from './navigation';
import type { ScreenId } from './navigation';
import { ReviewBar } from './review-bar';
import { AccountScreen } from './screens/account-screen';
import { HomeScreen } from './screens/home-screen';
import { LoginScreen } from './screens/login-screen';
import { getState } from './store';

interface ScreenNotes {
  stories: string;
  simulated: string;
  undecided: string;
}

interface ScreenSectionProps {
  id: ScreenId;
  address: string;
  notes: ScreenNotes;
  children: ReactNode;
}

const SCREEN_NOTES: Record<ScreenId, ScreenNotes> = {
  s01: {
    stories:
      'Historie z mapy: S01-K1, S01-K2, S01-K3 (cel przekierowania), S01-K4 (cel po wylogowaniu), S02-K1. Stany bez kryterium: walidacja i brak sieci (P3), blokada po 5 próbach (P2), błąd serwera 500 (P3, LDS4), wejście zalogowanego na ten adres (P5).',
    simulated:
      'Symulacja: hasło nie jest sprawdzane ani zapisywane, wynik logowania i konto wybiera panel scenariuszy, blokada po 5. nieudanej próbie i jej stały czas 900 s (LDS5), tekst błędu 500 (założenie A-P1), fokus na polu e-mail po błędzie (założenie A-P6), opóźnienie 0,7 s.',
    undecided:
      'Prototyp nie rozstrzyga: komunikatu po wygaśnięciu sesji (P4, LDS8), wielkości liter w e-mailu (P3), odliczania blokady na żywo (LDS5), resetu hasła i rejestracji (poza zakresem), wyglądu w ciemnym motywie (LDS6), marki i ikon (LDS7).',
  },
  s02: {
    stories:
      'Historie z mapy: S01-K1, S01-K3, S01-K4, S02-K1, S02-K2, S02-K5. Stany bez kryterium: ładowanie, pusta lista (P1, P15), błąd wczytania (P3), kolejność kont (P9), wiele kont wspólnych (P10), nazwa zalogowanej osoby na pasku (P7, LDS2), wylogowanie jako przycisk (P6, LDS1).',
    simulated:
      'Symulacja: stan listy wybiera panel scenariuszy; "dwie sesje naraz" to dwie ramki w jednej karcie przeglądarki (w aplikacji to dwie osobne sesje, np. dwie przeglądarki); "Spróbuj ponownie" kończy się po 0,6 s powodzeniem; wskaźnik żądania konta po id (S01-K6, S02-K3) to tylko tekst, bez ekranu.',
    undecided:
      'Prototyp nie rozstrzyga: ryzyka A02, że żona w ogóle chce wspólnego widoku (P16), ekranu odmowy przy cudzym koncie (P14, LDS3), docelowego adresu i zawartości konta (P8), wyglądu w ciemnym motywie (LDS6).',
  },
  s03: {
    stories:
      'Poza E01: atrapa celu linku konta z listy (P8). Własnych kryteriów nie ma; ekran konta należy do epików E02 i E03.',
    simulated:
      'Symulacja: cała treść poza nazwą konta, paskiem sesji i linkiem powrotnym jest atrapą; adres /?account=<id> jest tylko opisany.',
    undecided:
      'Prototyp nie rozstrzyga: zawartości ekranu konta (E02, E03), ekranu "brak dostępu" przy cudzym koncie (P14, LDS3), tego, czy lista kont po E03 zostaje osobnym widokiem (P8).',
  },
};

function ScreenSection({ id, address, notes, children }: ScreenSectionProps) {
  return (
    <section className="screen" id={id}>
      <div className="screen-meta">
        <h2>{SCREEN_TITLES[id]}</h2>
        <p>{address}</p>
      </div>
      <div className="frame">{children}</div>
      <div className="notes">
        <p className="note">{notes.stories}</p>
        <p className="note">{notes.simulated}</p>
        <p className="note">{notes.undecided}</p>
      </div>
    </section>
  );
}

function App() {
  useEffect(() => {
    window.__PROTOTYPE_START__?.();

    return installNavigationGate(getState);
  }, []);

  return (
    <>
      <ReviewBar />
      <div className="doc">
        <div className="doc-head">
          <h1>AITL, E01 Dostęp i logowanie: prototyp klikalny</h1>
        </div>
        <ScreenSection id="s01" address="Adres: /login (symulacja)" notes={SCREEN_NOTES.s01}>
          <LoginScreen />
        </ScreenSection>
        <ScreenSection id="s02" address="Adres: / (symulacja)" notes={SCREEN_NOTES.s02}>
          <HomeScreen />
        </ScreenSection>
        <ScreenSection id="s03" address="Adres: /?account=<id> (symulacja), atrapa poza E01" notes={SCREEN_NOTES.s03}>
          <AccountScreen />
        </ScreenSection>
      </div>
    </>
  );
}

export { App };
