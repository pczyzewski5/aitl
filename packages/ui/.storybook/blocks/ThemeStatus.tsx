import { cellClass, DocTable } from './DocTable';
import { darkProperties, lightProperties } from './tokens';

const THEME_ATTRIBUTE = 'data-theme';

export function ThemeStatus() {
  const active = document.documentElement.getAttribute(THEME_ATTRIBUTE) ?? 'light';
  const rows: readonly [string, number][] = [
    ['Jasny (:root)', Object.keys(lightProperties).length],
    ["Ciemny ([data-theme='dark'])", Object.keys(darkProperties).length],
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        Aktywny motyw (<code>data-theme</code> na elemencie <code>html</code>): <strong>{active}</strong>
      </p>
      <DocTable caption="Liczba zdefiniowanych tokenów w motywie" headers={['Motyw', 'Tokeny']}>
        {rows.map(([label, count]) => (
          <tr key={label}>
            <th scope="row" className={`${cellClass} font-semibold`}>
              {label}
            </th>
            <td className={cellClass}>{count}</td>
          </tr>
        ))}
      </DocTable>
    </div>
  );
}
