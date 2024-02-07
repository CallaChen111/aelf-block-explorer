/*
 * @Author: aelf-lxy
 * @Date: 2023-08-02 14:46:36
 * @LastEditors: aelf-lxy
 * @LastEditTime: 2023-08-02 15:49:51
 * @Description: header
 */
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isMobileDevices } from '@_utils/isMobile';
import HeaderTop from '@_components/HeaderTop';
import HeaderMenu from '@_components/HeaderMenu';
import './index.css';
import Search from '@_components/Search';
import { IsMain } from '@_utils/isMainNet';
import clsx from 'clsx';
import { SearchThemeMode } from '@_components/Search/type';

const NETWORK_TYPE = process.env.NEXT_PUBLIC_NETWORK_TYPE;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
const clsPrefix = 'header-container';
let jumpFlag = false;
export default function Header({ priceSSR, previousPriceSSR, explorerList, networkList, isMobileSSR, menuList }) {
  const [showSearch, setShowSearch] = useState(true);
  const onlyMenu = useMemo(() => {
    return showSearch ? '' : 'only-menu ';
  }, [showSearch]);
  const [isMobile, setIsMobile] = useState(isMobileSSR);
  const isMainNet = process.env.NEXT_PUBLIC_NETWORK_TYPE === 'MAIN' ? 'main-net' : 'test-net';
  const [price, setPrice] = useState(priceSSR);
  const [previousPrice, setPreviousPrice] = useState(previousPriceSSR);
  const pathname = usePathname();
  const isHideSearch = pathname === '/' || pathname.includes('search-');
  useEffect(() => {
    setIsMobile(isMobileDevices());
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const { price: p, previousPrice: prevP } = {
        price: { USD: 1 },
        previousPrice: { usd: 2 },
      };
      if (CHAIN_ID === 'AELF' && NETWORK_TYPE === 'MAIN' && !isMobile) {
        setPrice(p);
        setPreviousPrice(prevP);
        jumpFlag = true;
      }
    };
    // include headertop and home page
    if (window.location.pathname === '/') {
      fetchData();
    } else if (CHAIN_ID === 'AELF' && NETWORK_TYPE === 'MAIN' && !isMobile) {
      // only once
      if (!jumpFlag) {
        fetchData();
      }
    }
  }, [pathname, isMobile]);
  const range = useMemo(() => {
    if (price.USD && previousPrice.usd) {
      const res = ((price.USD - previousPrice.usd) / previousPrice.usd) * 100;
      return `${res >= 0 ? '+' : ''}${res}%`;
    }
    return '-';
  }, [price, previousPrice]);
  const getSearchStatus = () => {
    let showSearch = false;
    // don't show search -> home page | search-*
    // show search -> other pages
    if (pathname === '/' || pathname.includes('search-')) {
      showSearch = false;
    } else {
      showSearch = true;
    }
    return showSearch;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.location.pathname === '/') {
        setShowSearch(getSearchStatus());
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={clsx(clsPrefix, `${onlyMenu}${isMainNet}`, isMobile && `${clsPrefix}-mobile`)}>
      <>
        {isMobile && !isHideSearch && (
          <div className={clsx('px-3', 'py-2', IsMain && 'bg-main-blue')}>
            <Search
              searchButton
              searchWrapClassNames="max-w-[509px]"
              placeholder={'Search by Address / Txn Hash / Block'}
              pageThemeMode={IsMain ? SearchThemeMode.MAIN : SearchThemeMode.LIGHT}
              modalThemeMode={IsMain ? SearchThemeMode.MAIN : SearchThemeMode.LIGHT}
            />
          </div>
        )}
        {
          <HeaderTop
            price={price.USD}
            range={range}
            explorerList={explorerList}
            isMobile={isMobile}
            networkList={networkList}
            isHideSearch={isHideSearch}
            menuList={menuList}></HeaderTop>
        }
        {!isMobile && <HeaderMenu isMobile={isMobile} networkList={networkList} menuList={menuList}></HeaderMenu>}
      </>
    </div>
  );
}
