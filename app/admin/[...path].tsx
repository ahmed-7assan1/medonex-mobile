import { useLocalSearchParams } from 'expo-router';
import { WebsiteAdminApp } from '@/components/admin/WebsiteAdminApp';

/** Every admin route renders the actual MedQs0 admin page inside the local console. */
export default function AdminRoute() {
  const params = useLocalSearchParams();
  const segments = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const path = '/' + ['admin', ...segments].map((segment) => String(segment).replace(/[^A-Za-z0-9[\]_.-]/g, '')).join('/');
  const query = Object.entries(params)
    .filter(([key]) => key !== 'path')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return <WebsiteAdminApp route={path + (query ? `?${query}` : '')} />;
}
