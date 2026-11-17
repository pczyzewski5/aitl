import type { ReactNode } from 'react';
import { cellClass, DocTable } from './DocTable';
import type { TokenEntry } from './token-catalog';
import { cssVar, reference, resolved } from './tokens';

interface TokenTableProps {
  readonly caption: string;
  readonly entries: readonly TokenEntry[];
  readonly preview?: (name: string) => ReactNode;
  readonly previewHeader?: string;
}

export function TokenTable({ caption, entries, preview, previewHeader = 'Podgląd' }: TokenTableProps) {
  const headers = ['Token', ...(preview ? [previewHeader] : []), 'Wartość', 'Pochodzenie', 'Gdzie używać', 'Gdzie nie używać'];
  return (
    <DocTable caption={caption} headers={headers}>
      {entries.map((entry) => {
        const value = resolved(entry.name);
        const source = reference(entry.name);
        return (
          <tr key={entry.name}>
            <th scope="row" className={`${cellClass} font-semibold`}>
              <code>{entry.name}</code>
            </th>
            {preview ? <td className={cellClass}>{preview(entry.name)}</td> : null}
            <td className={cellClass}>
              <code>{value}</code>
              {source !== value ? (
                <div className="text-muted-foreground">
                  <code>{source}</code>
                </div>
              ) : null}
            </td>
            <td className={cellClass}>{entry.origin}</td>
            <td className={cellClass}>{entry.use}</td>
            <td className={cellClass}>{entry.avoid}</td>
          </tr>
        );
      })}
    </DocTable>
  );
}

export const swatch = (name: string): ReactNode => (
  <span
    aria-hidden="true"
    className="inline-block h-6 w-12 rounded-control border border-border"
    style={{ backgroundColor: cssVar(name) }}
  />
);
