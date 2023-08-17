/*
 * @Author: aelf-lxy
 * @Date: 2023-07-31 15:42:09
 * @LastEditors: Peterbjx
 * @LastEditTime: 2023-08-15 15:05:11
 * @Description: Contracts
 */
import ContractsList from './contractsList';
import { headers } from 'next/headers';
import { isMobileOnServer } from '@_utils/isMobile';
export default function BlocksPage() {
  const headersList = headers();
  const isMobile = isMobileOnServer(headersList);
  return <ContractsList isMobileSSR={isMobile} />;
}
