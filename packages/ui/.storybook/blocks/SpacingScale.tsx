import { cellClass, DocTable } from './DocTable';
import { SPACE_SCALE } from './token-catalog';
import { cssVar, resolved } from './tokens';

export function SpacingScaleTable() {
  return (
    <DocTable caption="Skala odstępów (warstwa 1, siatka 4 px)" headers={['Token', 'Wartość', 'Podgląd']}>
      {SPACE_SCALE.map((name) => (
        <tr key={name}>
          <th scope="row" className={`${cellClass} font-semibold`}>
            <code>{name}</code>
          </th>
          <td className={cellClass}>
            <code>{resolved(name)}</code>
          </td>
          <td className={cellClass}>
            <span
              aria-hidden="true"
              className="inline-block h-4 bg-primary"
              style={{ width: cssVar(name) }}
            />
          </td>
        </tr>
      ))}
    </DocTable>
  );
}

export function SpacingRelations() {
  return (
    <div className="rounded-card border border-border bg-card text-card-foreground" style={{ padding: cssVar('--space-panel') }}>
      <p className="text-sm text-muted-foreground">Panel: odstęp wewnętrzny z <code>--space-panel</code></p>
      <div className="flex" style={{ gap: cssVar('--space-between-groups'), paddingTop: cssVar('--space-between-groups') }}>
        {['Karta A (przykład)', 'Karta B (przykład)'].map((label) => (
          <div
            key={label}
            className="rounded-card border border-border text-sm"
            style={{ padding: cssVar('--space-panel') }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="flex text-sm" style={{ gap: cssVar('--space-within-group'), paddingTop: cssVar('--space-between-groups') }}>
        <span className="rounded-control border border-border px-2 py-1">Przycisk</span>
        <span className="rounded-control border border-border px-2 py-1">Przycisk</span>
      </div>
    </div>
  );
}
