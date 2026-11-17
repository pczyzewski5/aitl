import { cssVar } from './tokens';

const surface = 'border border-border bg-card p-4 text-sm text-card-foreground';

export function ShapeDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4 rounded-card border border-border bg-background p-4">
      <div className={surface} style={{ borderRadius: cssVar('--radius'), boxShadow: cssVar('--shadow-card') }}>
        <code>--radius</code>: pola, przyciski
      </div>
      <div className={surface} style={{ borderRadius: cssVar('--radius-surface'), boxShadow: cssVar('--shadow-card') }}>
        <code>--radius-surface</code>: karty, panel, formularz
      </div>
      <span
        className="inline-block px-2 py-1 text-sm"
        style={{
          borderRadius: cssVar('--radius-badge'),
          backgroundColor: cssVar('--badge-shared-bg'),
          color: cssVar('--badge-shared-fg'),
        }}
      >
        wspólne (przykład)
      </span>
    </div>
  );
}
