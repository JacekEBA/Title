import { redirect } from 'next/navigation';
import { getSession, landingRedirectPath } from '../lib/auth';

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const path = await landingRedirectPath();
  redirect(path);
}




