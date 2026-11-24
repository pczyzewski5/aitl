'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall, AppShell, LoginForm } from '@aitl/ui';
import type { LoginResult, LoginValues } from '@aitl/ui';
import { toLoginResult } from '../../auth/to-login-result';
import { requestHeadingFocus, useRequestedHeadingFocus } from '../../focus/heading-focus';
import { HOME_PATH, LOGIN_API_PATH } from '../../routes';

export function LoginScreen() {
  const router = useRouter();
  const content = useRef<HTMLDivElement>(null);
  useRequestedHeadingFocus(content);

  const login = async (values: LoginValues): Promise<LoginResult> => {
    const result = toLoginResult(await apiCall(LOGIN_API_PATH, { method: 'POST', body: values }));
    if (result.ok) {
      requestHeadingFocus();
      router.replace(HOME_PATH);
    }

    return result;
  };

  return (
    <AppShell>
      <div ref={content}>
        <LoginForm onSubmit={login} />
      </div>
    </AppShell>
  );
}
