import type { ReactNode } from 'react';

interface DocTableProps {
  readonly caption: string;
  readonly headers: readonly string[];
  readonly children: ReactNode;
}

export function DocTable({ caption, headers, children }: DocTableProps) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-card border border-border bg-card p-4 text-card-foreground"
    >
      <table className="w-full border-collapse text-left text-sm">
        <caption className="pb-3 text-left text-lg">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-2 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const cellClass = 'border-b border-border px-2 py-2 align-top';
