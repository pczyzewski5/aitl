import { redirect } from 'next/navigation';
import { loadCurrentUser } from '../../http/current-user';
import { HOME_PATH } from '../../routes';
import { LoginScreen } from './login-screen';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if ((await loadCurrentUser()) !== null) {
    redirect(HOME_PATH);
  }

  return <LoginScreen />;
}
