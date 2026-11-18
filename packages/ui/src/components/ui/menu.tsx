'use client';

import { Fragment, useRef } from 'react';
import Ellipsis from 'lucide-react/icons/ellipsis';
import { DropdownMenu } from 'radix-ui';
import { cn } from '../../lib/utils';
import { Button } from './button';

const MENU_SIDE_OFFSET_PX = 4;
const MENU_EDGE_PADDING_PX = 16;

interface MenuItemBase {
  id: string;
  label: string;
  destructive?: boolean;
}

interface MenuEnabledItem extends MenuItemBase {
  onSelect: () => void;
  disabled?: false;
  disabledReason?: undefined;
}

interface MenuDisabledItem extends MenuItemBase {
  disabled: true;
  disabledReason: string;
  onSelect?: undefined;
}

type MenuItem = MenuEnabledItem | MenuDisabledItem;

interface MenuProps {
  triggerLabel: string;
  items: MenuItem[];
  align?: 'start' | 'end';
  defaultOpen?: boolean;
}

function startsDestructiveGroup(previous: MenuItem | undefined): boolean {
  return previous !== undefined && !previous.destructive;
}

interface MenuRowProps {
  item: MenuItem;
  onChoose: (action: () => void) => void;
}

function MenuRow({ item, onChoose }: MenuRowProps) {
  const handleSelect = (event: Event) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    onChoose(item.onSelect);
  };

  return (
    <DropdownMenu.Item
      data-slot="menu-item"
      data-destructive={item.destructive || undefined}
      data-disabled={item.disabled ? '' : undefined}
      aria-disabled={item.disabled || undefined}
      className={cn(
        'flex min-h-control w-full cursor-default flex-col justify-center rounded-control px-(--space-within-group) py-(--space-1) text-sm leading-base select-none',
        'focus-visible:-outline-offset-2 data-highlighted:bg-muted',
        item.destructive ? 'text-destructive' : 'text-card-foreground',
        'data-disabled:cursor-not-allowed data-disabled:text-muted-foreground',
      )}
      onSelect={handleSelect}
    >
      <span className="wrap-anywhere">
        {item.label}
      </span>
      {item.disabled ? (
        <span data-slot="menu-item-reason" className="max-w-72 text-muted-foreground wrap-anywhere">
          {item.disabledReason}
        </span>
      ) : null}
    </DropdownMenu.Item>
  );
}

function Menu({ triggerLabel, items, align = 'end', defaultOpen = false }: MenuProps) {
  const chosenAction = useRef<(() => void) | null>(null);

  const choose = (action: () => void) => {
    chosenAction.current = action;
  };

  const runChosenActionAfterFocusReturn = () => {
    const action = chosenAction.current;
    chosenAction.current = null;
    if (action) {
      queueMicrotask(action);
    }
  };

  return (
    <DropdownMenu.Root modal={false} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={triggerLabel}>
          <Ellipsis aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          data-slot="menu-content"
          align={align}
          sideOffset={MENU_SIDE_OFFSET_PX}
          collisionPadding={MENU_EDGE_PADDING_PX}
          onCloseAutoFocus={runChosenActionAfterFocusReturn}
          className="z-50 w-max max-w-(--radix-dropdown-menu-content-available-width) rounded-card border border-border bg-card p-(--space-1) text-card-foreground outline-none"
        >
          {items.map((item, index) => (
            <Fragment key={item.id}>
              {item.destructive && startsDestructiveGroup(items[index - 1]) ? (
                <DropdownMenu.Separator
                  data-slot="menu-separator"
                  className="my-(--space-1) border-t border-border"
                />
              ) : null}
              <MenuRow item={item} onChoose={choose} />
            </Fragment>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export { Menu };
export type { MenuItem, MenuProps };
