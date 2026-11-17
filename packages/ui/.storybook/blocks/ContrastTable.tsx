import { evaluatePairs, type EvaluatedPair, type PairKind } from '../../src/design-tokens/contrast-pairs.ts';
import { formatRatio } from '../../src/design-tokens/contrast.ts';
import { cellClass, DocTable } from './DocTable';
import { cssVar, tokensCss } from './tokens';

const VERDICT_LABELS: Record<EvaluatedPair['verdict'], string> = {
  ok: 'Dozwolona',
  'not-allowed': 'Niedozwolona: pole nie może leżeć bezpośrednio na tym tle',
  decorative: 'Dekoracja: nie niesie informacji (zatwierdzone)',
};

const KIND_HEADERS = ['Para', 'Podgląd', 'Wartości', 'Kontrast', 'Próg', 'Wynik'];

function Sample({ pair }: { readonly pair: EvaluatedPair }) {
  if (pair.kind === 'text') {
    return (
      <span
        className="inline-block rounded-control px-2 py-1"
        style={{ color: cssVar(pair.foreground), backgroundColor: cssVar(pair.background) }}
      >
        Aa 3 975,50 zł
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-block h-6 w-16 rounded-control"
      style={{ backgroundColor: cssVar(pair.background), border: `2px solid ${cssVar(pair.foreground)}` }}
    />
  );
}

function resultLabel(pair: EvaluatedPair): string {
  if (pair.verdict !== 'ok') {
    return VERDICT_LABELS[pair.verdict];
  }
  return pair.meetsThreshold ? 'Spełnia próg' : 'Poniżej progu: wymaga decyzji';
}

export function ContrastTable({ kind, caption }: { readonly kind: PairKind; readonly caption: string }) {
  const pairs = evaluatePairs(tokensCss).filter((pair) => pair.kind === kind);
  return (
    <DocTable caption={caption} headers={KIND_HEADERS}>
      {pairs.map((pair) => (
        <tr key={`${pair.foreground}-${pair.background}`}>
          <th scope="row" className={`${cellClass} font-semibold`}>
            <code>{pair.foreground}</code> na <code>{pair.background}</code>
          </th>
          <td className={cellClass}>
            <Sample pair={pair} />
          </td>
          <td className={cellClass}>
            <code>{pair.foregroundValue}</code> na <code>{pair.backgroundValue}</code>
          </td>
          <td className={cellClass}>
            {formatRatio(pair.ratio)}
            {pair.ratio === pair.approvedRatio ? '' : ` (zatwierdzone: ${formatRatio(pair.approvedRatio)})`}
          </td>
          <td className={cellClass}>{formatRatio(pair.threshold)}</td>
          <td className={cellClass}>{resultLabel(pair)}</td>
        </tr>
      ))}
    </DocTable>
  );
}
