'use client';

import { useId, useRef } from 'react';
import { ErrorSummary } from '../../backend/forms/error-summary';
import { useFormValidation } from '../../backend/forms/use-form-validation';
import type { FieldErrors, SubmitResult } from '../../backend/forms/use-form-validation';
import { cn } from '../../lib/utils';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Field } from '../ui/field';
import { Input } from '../ui/input';
import { describeLoginFailure } from './login-failure';
import type { LoginResult } from './login-failure';
import { DEFAULT_LOGIN_MESSAGES } from './messages';
import type { LoginFormMessages } from './messages';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const EMAIL_FIELD = 'email';

type LoginValues = { email: string; password: string };
type LoginHeadingLevel = 'h1' | 'h2';

interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<LoginResult>;
  messages?: Partial<LoginFormMessages>;
  headingLevel?: LoginHeadingLevel;
  className?: string;
}

function validateLogin(values: LoginValues, messages: LoginFormMessages): FieldErrors<LoginValues> {
  const email = values.email.trim();
  let emailError: string | undefined;
  if (email === '') {
    emailError = messages.emailRequired;
  } else if (!EMAIL_PATTERN.test(email)) {
    emailError = messages.emailInvalid;
  }

  return { email: emailError, password: values.password === '' ? messages.passwordRequired : undefined };
}

function LoginForm({ onSubmit, messages, headingLevel: Heading = 'h1', className }: LoginFormProps) {
  const text: LoginFormMessages = { ...DEFAULT_LOGIN_MESSAGES, ...messages };
  const headingId = useId();
  const signedInRef = useRef(false);
  const form = useFormValidation<LoginValues>({
    initialValues: { email: '', password: '' },
    validate: (values) => validateLogin(values, text),
    onSubmit: async (values): Promise<SubmitResult<LoginValues>> => {
      if (signedInRef.current) {
        return { ok: true };
      }

      const failWith = (formError: string): SubmitResult<LoginValues> => {
        form.focusField(EMAIL_FIELD);

        return { ok: false, formError };
      };

      let result: LoginResult;
      try {
        result = await onSubmit({ email: values.email.trim(), password: values.password });
      } catch {
        return failWith(text.network);
      }

      if (result.ok) {
        signedInRef.current = true;
        return { ok: true };
      }

      return failWith(describeLoginFailure(result, text));
    },
  });

  return (
    <Card data-slot="login-form" className={cn('w-full max-w-md', className)}>
      <Heading id={headingId} className="min-w-0 text-xl font-semibold leading-base wrap-anywhere">
        {text.title}
      </Heading>
      <form {...form.formProps} aria-labelledby={headingId} className="flex flex-col gap-(--space-between-fields)">
        {form.formError && (
          <Alert variant="error">
            <AlertDescription>{form.formError}</AlertDescription>
          </Alert>
        )}
        <ErrorSummary title={text.summaryTitle} errors={form.summary} onSelect={form.focusField} />
        <Field label={text.emailLabel} {...form.getFieldProps(EMAIL_FIELD)}>
          <Input type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} {...form.getInputProps(EMAIL_FIELD)} />
        </Field>
        <Field label={text.passwordLabel} {...form.getFieldProps('password')}>
          <Input type="password" autoComplete="current-password" {...form.getInputProps('password')} />
        </Field>
        <div>
          <Button type="submit" loading={form.submitting}>
            {form.submitting ? text.submittingLabel : text.submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export { LoginForm };
export type { LoginFormProps, LoginHeadingLevel, LoginValues };
