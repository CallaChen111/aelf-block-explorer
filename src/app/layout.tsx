/*
 * @Author: aelf-lxy
 * @Date: 2023-07-31 14:37:10
 * @LastEditors: aelf-lxy
 * @LastEditTime: 2023-08-10 15:01:40
 * @Description: root layout
 */
import '@_style/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import RootProvider from './pageProvider';
import Header from '@_components/Header';
import Footer from '@_components/Footer';
import { headers } from 'next/headers';
import request from '@_api';
import StyledComponentsRegistry from '@_lib/AntdRegistry';
import { isMobileOnServer } from '@_utils/isMobile';
import clsx from 'clsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};
async function fetchData() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const res = {
    price: { USD: 1 },
    previousPrice: { usd: 2 },
  };
  // const res = await request.common.getPrice({ cache: 'no-store' } as Request);
  return res;
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchData();
  const { price, previousPrice } = data;
  const headersList = headers();
  const isMobile = isMobileOnServer(headersList);

  return (
    <html lang="en">
      <body className={clsx(inter.className, 'relative min-h-screen')}>
        <StyledComponentsRegistry>
          <Header priceSSR={price} previousPriceSSR={previousPrice} isMobileSSR={isMobile} />
          <RootProvider>{children}</RootProvider>
          <Footer isMobileSSR={isMobile} />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
