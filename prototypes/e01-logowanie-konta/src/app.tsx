import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SCREEN_TITLES, installNavigationGate } from './navigation';
import type { ScreenId } from './navigation';
import { ReviewBar } from './review-bar';
import { AccountScreen } from './screens/account-screen';
import { HomeScreen } from './screens/home-screen';
import { LoginScreen } from './screens/login-screen';
import { getState } from './store';

interface ScreenSectionProps {
  id: ScreenId;
  address: string;
  children: ReactNode;
}

function ScreenSection({ id, address, children }: ScreenSectionProps) {
  return (
    <section className="screen" id={id}>
      <div className="screen-meta">
        <h2>{SCREEN_TITLES[id]}</h2>
        <p>{address}</p>
      </div>
      <div className="frame">{children}</div>
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
        <ScreenSection id="s01" address="Adres: /login (symulacja)">
          <LoginScreen />
        </ScreenSection>
        <ScreenSection id="s02" address="Adres: / (symulacja)">
          <HomeScreen />
        </ScreenSection>
        <ScreenSection id="s03" address="Adres: /?account=<id> (symulacja), atrapa poza E01">
          <AccountScreen />
        </ScreenSection>
      </div>
    </>
  );
}

export { App };
