import { WebsiteAdminApp } from '@/components/admin/WebsiteAdminApp';

/** `/studio/sync` lives in the website's admin group and shares its chrome. */
export default function StudioSyncRoute() {
  return <WebsiteAdminApp route="/studio/sync" />;
}
