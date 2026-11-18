'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { Button } from './button';

const DURATION_TOKEN = '--toast-duration';
const MILLISECONDS_PATTERN = /^(\d+(?:\.\d+)?)ms$/;
const SWIPE_DISABLED_THRESHOLD = Number.POSITIVE_INFINITY;

type ToastAnnounce = 'polite' | 'assertive';

interface ToastOptions {
  message: string;
  announce?: ToastAnnounce;
}

interface QueuedToast extends ToastOptions {
  id: string;
}

interface ToastApi {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

interface ToastProviderProps {
  children: ReactNode;
  closeLabel: string;
  viewportLabel: string;
  announcementLabel: string;
}

const ToastContext = createContext<ToastApi | null>(null);

function readDurationToken(): number | undefined {
  const value = getComputedStyle(document.documentElement).getPropertyValue(DURATION_TOKEN).trim();
  const match = MILLISECONDS_PATTERN.exec(value);
  return match ? Number(match[1]) : undefined;
}

function ToastProvider({ children, closeLabel, viewportLabel, announcementLabel }: ToastProviderProps) {
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  const lastId = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    lastId.current += 1;
    const id = `toast-${lastId.current}`;
    setQueue((current) => [...current, { ...options, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setQueue((current) => current.filter((queued) => queued.id !== id));
  }, []);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  const visible = queue[0];

  return (
    <ToastContext value={api}>
      <ToastPrimitive.Provider label={announcementLabel} swipeThreshold={SWIPE_DISABLED_THRESHOLD}>
        {children}
        {visible ? (
          <ToastPrimitive.Root
            key={visible.id}
            data-slot="toast"
            type={visible.announce === 'assertive' ? 'foreground' : 'background'}
            duration={readDurationToken()}
            onOpenChange={() => dismiss(visible.id)}
            className="flex items-start gap-(--space-within-group) rounded-card border border-border bg-card p-(--space-panel) text-foreground"
          >
            <ToastPrimitive.Description data-slot="toast-message" className="min-w-0 flex-1 text-sm leading-base wrap-anywhere">
              {visible.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <Button variant="secondary">{closeLabel}</Button>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ) : null}
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          label={viewportLabel}
          className="fixed bottom-(--toast-viewport-offset) left-(--toast-viewport-offset) right-(--toast-viewport-offset) z-50 m-0 list-none p-0 outline-none md:left-auto md:w-96"
        />
      </ToastPrimitive.Provider>
    </ToastContext>
  );
}

function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return api;
}

export { ToastProvider, useToast };
export type { ToastAnnounce, ToastApi, ToastOptions, ToastProviderProps };
