'use client';

import { Check } from 'lucide-react';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { ErrorState } from '../ui/error-state';
import { Skeleton } from '../ui/skeleton';
import { ACCOUNT_REMAINDER_CARD_MESSAGES, type AccountRemainderCardMessages } from './account-remainder-card.messages';

type AccountType = 'shared' | 'personal';
type MinorAmount = number | bigint;

interface AccountRemainderCardBaseProps {
  name: string;
  accountType: AccountType;
  messages?: Partial<AccountRemainderCardMessages>;
  className?: string;
}

interface AccountRemainderCardReadyProps extends AccountRemainderCardBaseProps {
  status?: 'ready';
  remainderMinor: MinorAmount;
  incomeMinor: MinorAmount;
  expensesMinor: MinorAmount;
  selected: boolean;
  onSelect: () => void;
}

interface AccountRemainderCardLoadingProps extends AccountRemainderCardBaseProps {
  status: 'loading';
  selected: boolean;
  onSelect: () => void;
}

interface AccountRemainderCardErrorProps extends AccountRemainderCardBaseProps {
  status: 'error';
  onRetry: () => void;
  retrying?: boolean;
}

type AccountRemainderCardProps =
  | AccountRemainderCardReadyProps
  | AccountRemainderCardLoadingProps
  | AccountRemainderCardErrorProps;

const TONE_CLASSES = {
  positive: 'text-income',
  negative: 'text-expense',
  zero: 'text-card-foreground',
} as const;

function toneClass(amountMinor: MinorAmount): string {
  if (amountMinor > 0) {
    return TONE_CLASSES.positive;
  }
  if (amountMinor < 0) {
    return TONE_CLASSES.negative;
  }
  return TONE_CLASSES.zero;
}

function accountTypeLabel(accountType: AccountType, text: AccountRemainderCardMessages): string {
  return accountType === 'shared' ? text.sharedAccountLabel : text.personalAccountLabel;
}

const TOGGLE_CLASSES =
  'flex w-full cursor-pointer flex-col gap-(--space-card-gap) rounded-card border-2 bg-card p-(--space-panel) text-left text-card-foreground transition-colors duration-(--duration-feedback) hover:bg-background';

interface AmountRowProps {
  label: string;
  amountMinor: MinorAmount;
  display: string;
}

function AmountRow({ label, amountMinor, display }: AmountRowProps) {
  return (
    <span className="flex flex-wrap justify-between gap-x-(--space-within-group) text-sm leading-base">
      <span className="text-muted-foreground">{label}:</span>
      <span data-slot="account-remainder-amount" className={toneClass(amountMinor)}>
        {display}
      </span>
    </span>
  );
}

function AccountRemainderCard(props: AccountRemainderCardProps) {
  const text = { ...ACCOUNT_REMAINDER_CARD_MESSAGES, ...props.messages };
  const badge = <Badge variant={props.accountType}>{accountTypeLabel(props.accountType, text)}</Badge>;

  if (props.status === 'error') {
    return (
      <Card
        data-slot="account-remainder-card"
        data-state="error"
        className={cn('border-2', props.className)}
      >
        <CardHeader>
          <CardTitle>{props.name}</CardTitle>
          {badge}
        </CardHeader>
        <ErrorState
          announce
          titleLevel="h4"
          title={text.errorTitle}
          description={text.errorDescription}
          retryLabel={text.retryLabel}
          retrying={props.retrying}
          onRetry={props.onRetry}
        />
      </Card>
    );
  }

  const loading = props.status === 'loading';

  return (
    <button
      type="button"
      data-slot="account-remainder-card"
      data-state={loading ? 'loading' : 'ready'}
      aria-pressed={props.selected}
      aria-busy={loading || undefined}
      onClick={props.onSelect}
      className={cn(TOGGLE_CLASSES, props.selected ? 'border-primary' : 'border-border', props.className)}
    >
      <span className="flex flex-wrap items-center justify-between gap-(--space-within-group)">
        <span className="min-w-0 text-base font-semibold leading-base wrap-anywhere">{props.name}</span>
        {badge}
      </span>
      <span className="flex items-center justify-between gap-(--space-within-group)">
        <span className="text-sm leading-base text-muted-foreground">{text.remainderLabel}</span>
        <span
          data-slot="account-remainder-marker"
          aria-hidden="true"
          className={cn(
            'inline-flex items-center gap-1 text-sm font-semibold leading-base text-primary',
            !props.selected && 'invisible',
          )}
        >
          <Check aria-hidden="true" className="size-4" />
          {text.selectedMarker}
        </span>
      </span>
      {props.status === 'loading' ? (
        <>
          <span className="sr-only">{text.loadingLabel}</span>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </>
      ) : (
        <>
          <span
            data-slot="account-remainder-value"
            className={cn('text-xl font-bold leading-base wrap-anywhere', toneClass(props.remainderMinor))}
          >
            {formatMoneyMinor(props.remainderMinor)}
          </span>
          <AmountRow
            label={text.incomeLabel}
            amountMinor={props.incomeMinor}
            display={formatMoneyMinor(props.incomeMinor, { sign: 'always' })}
          />
          <AmountRow
            label={text.expensesLabel}
            amountMinor={-props.expensesMinor}
            display={formatMoneyMinor(-props.expensesMinor, { sign: 'always' })}
          />
        </>
      )}
    </button>
  );
}

export { AccountRemainderCard };
export type {
  AccountRemainderCardErrorProps,
  AccountRemainderCardLoadingProps,
  AccountRemainderCardProps,
  AccountRemainderCardReadyProps,
  AccountType,
};
