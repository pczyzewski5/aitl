import { cellClass, DocTable } from './DocTable';
import { FONT_SIZES } from './token-catalog';
import { cssVar, resolved } from './tokens';

const BOLD_RESULT_SIZE = '--font-size-xl';

export function FontFamilySpecimen() {
  return (
    <div className="rounded-card border border-border bg-card p-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">
        <code>--font-sans</code>: <code>{resolved('--font-sans')}</code> (R01.3)
      </p>
      <p className="pt-2" style={{ fontFamily: cssVar('--font-sans') }}>
        Czcionka systemowa, bez plików czcionek i bez CDN.
      </p>
    </div>
  );
}

export function FontSizeTable() {
  return (
    <DocTable caption="Rozmiary czcionki" headers={['Token', 'Wartość', 'Podgląd', 'Pochodzenie', 'Gdzie używać', 'Gdzie nie używać']}>
      {FONT_SIZES.map((role) => (
        <tr key={role.name}>
          <th scope="row" className={`${cellClass} font-semibold`}>
            <code>{role.name}</code>
          </th>
          <td className={cellClass}>
            <code>{resolved(role.name)}</code>
          </td>
          <td className={cellClass}>
            <span
              style={{
                fontSize: cssVar(role.name),
                fontWeight: cssVar(role.name === BOLD_RESULT_SIZE ? '--font-weight-bold' : '--font-weight-normal'),
              }}
            >
              {role.sample}
            </span>
          </td>
          <td className={cellClass}>{role.origin}</td>
          <td className={cellClass}>{role.use}</td>
          <td className={cellClass}>{role.avoid}</td>
        </tr>
      ))}
    </DocTable>
  );
}
