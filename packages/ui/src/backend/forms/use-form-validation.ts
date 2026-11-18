import { useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { focusControl } from './focus-control';
import type { ErrorSummaryItem } from './error-summary';

type FieldValues = Record<string, string | boolean>;
type FieldName<Values extends FieldValues> = keyof Values & string;
type FieldErrors<Values extends FieldValues> = Partial<Record<FieldName<Values>, string>>;
type StringFieldName<Values extends FieldValues> = {
  [Name in FieldName<Values>]: Values[Name] extends string ? Name : never;
}[FieldName<Values>];

type SubmitResult<Values extends FieldValues> =
  | { ok: true }
  | { ok: false; fieldErrors: FieldErrors<Values>; formError?: string }
  | { ok: false; fieldErrors?: FieldErrors<Values>; formError: string };

interface SubmitHelpers {
  reset: () => void;
}

interface UseFormValidationOptions<Values extends FieldValues> {
  initialValues: Values;
  validate: (values: Values) => FieldErrors<Values>;
  onSubmit: (values: Values, helpers: SubmitHelpers) => Promise<SubmitResult<Values>>;
}

interface FieldWrapperProps {
  id: string;
  error: string | undefined;
}

interface InputFieldProps {
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: () => void;
}

interface FormValidation<Values extends FieldValues> {
  formProps: { noValidate: true; onSubmit: (event: FormEvent<HTMLFormElement>) => void };
  values: Values;
  errors: FieldErrors<Values>;
  summary: ErrorSummaryItem[];
  formError: string | undefined;
  submitting: boolean;
  getFieldProps: (name: FieldName<Values>) => FieldWrapperProps;
  getInputProps: (name: StringFieldName<Values>) => InputFieldProps;
  setValue: (name: FieldName<Values>, value: string | boolean) => void;
  touch: (name: FieldName<Values>) => void;
  focusField: (name: string) => void;
  reset: () => void;
}

const MIN_ERRORS_FOR_SUMMARY = 2;

function useFormValidation<Values extends FieldValues>({
  initialValues,
  validate,
  onSubmit,
}: UseFormValidationOptions<Values>): FormValidation<Values> {
  const formId = useId();
  const initialValuesRef = useRef(initialValues);
  const names = Object.keys(initialValuesRef.current) as FieldName<Values>[];
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<readonly string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<Values>>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const fieldId = (name: string) => `${formId}-${name}`;

  const focusField = (name: string) => focusControl(document.getElementById(fieldId(name)));

  const touch = (name: FieldName<Values>) =>
    setTouched((current) => (current.includes(name) ? current : [...current, name]));

  const setValue = (name: FieldName<Values>, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }));
    setServerErrors((current) => {
      if (!(name in current)) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const clientErrors = validate(values);
  const errors: FieldErrors<Values> = {};
  for (const name of names) {
    const clientError = submitAttempted || touched.includes(name) ? clientErrors[name] : undefined;
    const message = serverErrors[name] ?? clientError;
    if (message) {
      errors[name] = message;
    }
  }

  const invalidItems = names.flatMap((name) => {
    const message = errors[name];
    return message ? [{ name, fieldId: fieldId(name), message }] : [];
  });
  const summary = submitAttempted && invalidItems.length >= MIN_ERRORS_FOR_SUMMARY ? invalidItems : [];

  const reset = () => {
    setValues(initialValuesRef.current);
    setTouched([]);
    setSubmitAttempted(false);
    setServerErrors({});
    setFormError(undefined);
  };

  const submit = async () => {
    if (submittingRef.current) {
      return;
    }

    setSubmitAttempted(true);
    setFormError(undefined);
    setServerErrors({});

    const firstInvalid = names.find((name) => clientErrors[name]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    let result: SubmitResult<Values>;
    try {
      result = await onSubmit(values, { reset });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }

    if (result.ok) {
      return;
    }

    const fieldErrors: FieldErrors<Values> = result.fieldErrors ?? {};
    setServerErrors(fieldErrors);
    setFormError(result.formError);
    const firstServerInvalid = names.find((name) => fieldErrors[name]);
    if (firstServerInvalid) {
      focusField(firstServerInvalid);
    }
  };

  const getFieldProps = (name: FieldName<Values>): FieldWrapperProps => ({ id: fieldId(name), error: errors[name] });

  const getInputProps = (name: StringFieldName<Values>): InputFieldProps => ({
    name,
    value: values[name] as string,
    onChange: (event) => setValue(name, event.target.value),
    onBlur: () => touch(name),
  });

  return {
    formProps: {
      noValidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        void submit();
      },
    },
    values,
    errors,
    summary,
    formError,
    submitting,
    getFieldProps,
    getInputProps,
    setValue,
    touch,
    focusField,
    reset,
  };
}

export { useFormValidation };
export type {
  FieldErrors,
  FieldValues,
  FieldWrapperProps,
  FormValidation,
  InputFieldProps,
  StringFieldName,
  SubmitHelpers,
  SubmitResult,
  UseFormValidationOptions,
};
