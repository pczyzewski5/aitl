import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { TextLink } from '../../components/ui/text-link';

interface ErrorSummaryItem {
  name: string;
  fieldId: string;
  message: string;
}

interface ErrorSummaryProps {
  title: string;
  errors: readonly ErrorSummaryItem[];
  onSelect: (name: string) => void;
  className?: string;
}

function ErrorSummary({ title, errors, onSelect, className }: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Alert variant="error" data-slot="error-summary" className={className}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="m-0 flex list-disc flex-col gap-(--space-label-field) pl-5">
          {errors.map((error) => (
            <li key={error.name} className="wrap-anywhere">
              <TextLink
                href={`#${error.fieldId}`}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(error.name);
                }}
              >
                {error.message}
              </TextLink>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export { ErrorSummary };
export type { ErrorSummaryItem, ErrorSummaryProps };
