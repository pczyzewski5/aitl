import { redirect } from 'next/navigation';
import { loadCurrentUser } from '../http/current-user';
import { LOGIN_PATH } from '../routes';
import { AccountsScreen } from './accounts-screen';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await loadCurrentUser();
  if (user === null) {
    redirect(LOGIN_PATH);
  }

  return <AccountsScreen displayName={user.displayName} />;
}
