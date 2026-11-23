import { Redirect } from 'expo-router';

/** `/admin` alone has no UI — same redirect as the website. */
export default function AdminRoot() {
  return <Redirect href="/admin/dashboard" />;
}
