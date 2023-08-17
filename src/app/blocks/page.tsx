import BlockList from './blockList';
import { headers } from 'next/headers';
import { isMobileOnServer } from '@_utils/isMobile';
export default function BlocksPage() {
  const headersList = headers();
  const isMobile = isMobileOnServer(headersList);
  return <BlockList isMobileSSR={isMobile} />;
}
