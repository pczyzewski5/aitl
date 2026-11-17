import { useState } from 'react';
import { cssVar, resolved } from './tokens';

export function MotionDemo() {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="rounded-card border border-border bg-card p-4 text-card-foreground">
      <p className="pb-3 text-sm">
        <code>--duration-feedback</code>: <code>{resolved('--duration-feedback')}</code>. Najedź na przycisk, żeby zobaczyć hover.
      </p>
      <button
        type="button"
        className="rounded-control px-4 py-2 text-sm text-primary-foreground"
        style={{
          backgroundColor: cssVar(hovered ? '--primary-hover' : '--primary'),
          transitionProperty: 'background-color',
          transitionDuration: cssVar('--duration-feedback'),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        Dodaj wpis
      </button>
    </div>
  );
}
