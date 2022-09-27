import React, { useEffect, useState, useCallback, useMemo } from 'react';
import TPSChart from '../../components/TPSChart/TPSChart';
import {
  ALL_BLOCKS_API_URL,
  ALL_TXS_API_URL,
  BASIC_INFO,
  ELF_REALTIME_PRICE_URL,
  HISTORY_PRICE,
} from '../../constants';
import { get, transactionFormat } from 'utils/axios';
import ChainInfo from './components/ChainInfo';
import LatestInfo from './components/LatestInfo';
import Search from './components/Search';
import useMobile from '../../hooks/useMobile';
import { CHAIN_ID } from '../../constants/config/config';
import TokenIcon from '../../assets/images/tokenLogo.png';
import { initSocket } from './socket';
import {
  BasicInfo,
  BlocksResult,
  BlockItem,
  TXSResultDto,
  TXItem,
  FormatBlockDto,
  SocketTxItem,
  SocketData,
  HomeProps,
} from './types';
require('./Home.styles.less');

const PAGE_SIZE = 25;

export default function Home({
  mobilePrice,
  mobilePrevPrice,
  tpsData,
  blockHeight,
  rewardSSR,
  localAccountsSSR,
  unconfirmedBlockHeightSSR,
  localTransactionsSSR,
  transactionsSSR,
  blocksSSR,
}: HomeProps) {
  const [price, setPrice] = useState(mobilePrice || { USD: 0 });
  const [previousPrice, setPreviousPrice] = useState(mobilePrevPrice || { usd: 0 });
  const [blocks, setBlocks] = useState<BlockItem[]>(blocksSSR || []);
  const [transactions, setTransactions] = useState<TXItem[]>(transactionsSSR || []);
  const [reward, setReward] = useState(rewardSSR || { ELF: 0 });
  // type of BasicInfo.totalTxs not equal to TXSResultDto.total
  const [localTransactions, setLocalTransactions] = useState(localTransactionsSSR || 0);
  const [localAccounts, setLocalAccounts] = useState(localAccountsSSR || 0);
  const [unconfirmedBlockHeight, setUnconfirmedBlockHeight] = useState(unconfirmedBlockHeightSSR || '0');
  const isMobile = useMobile();
  const latestSection = useMemo(
    () => <LatestInfo blocks={blocks} transactions={transactions} />,
    [blocks, transactions],
  );
  // let blockHeight = basicInfoData.height;
  const range = useMemo(() => {
    if (price.USD && previousPrice.usd) {
      return ((price.USD - previousPrice.usd) / previousPrice.usd) * 100;
    }
    return 0;
  }, [price.USD, previousPrice.usd]);

  useEffect(() => {
    if (CHAIN_ID === 'AELF' && isMobile) {
      get(ELF_REALTIME_PRICE_URL).then((price: any) => setPrice(price));
      get(HISTORY_PRICE, {
        token_id: 'aelf',
        vs_currencies: 'usd',
        date: new Date(new Date().toLocaleDateString()).valueOf() - 24 * 3600 * 1000,
      }).then((res: any) => {
        if (!res.message) {
          setPreviousPrice(res);
        }
      });
    }
  }, [isMobile]);

  // csr only
  useEffect(() => {
    const socket = initSocket(handleSocketData);
    initBasicInfo();
    initBlock();
    initTxs();
    return () => {
      socket.close();
    };
  }, [initSocket]);

  const fetch = useCallback(async (url: string) => {
    const res = await get(url, {
      page: 0,
      limit: PAGE_SIZE,
      order: 'desc',
    });

    return res;
  }, []);

  const initBasicInfo = useCallback(async () => {
    const result: BasicInfo = (await get(BASIC_INFO)) as BasicInfo;

    const { height = 0, totalTxs, unconfirmedBlockHeight = '0', accountNumber = 0 } = result;
    blockHeight = height;
    setLocalTransactions(totalTxs);
    setUnconfirmedBlockHeight(unconfirmedBlockHeight);
    setLocalAccounts(accountNumber);
  }, []);

  const initBlock = useCallback(async () => {
    const blocksResult: BlocksResult = (await fetch(ALL_BLOCKS_API_URL)) as BlocksResult;
    const blocks = blocksResult.blocks;
    setBlocks(blocks);
  }, []);

  const initTxs = useCallback(async () => {
    const TXSResult: TXSResultDto = (await fetch(ALL_TXS_API_URL)) as TXSResultDto;
    const transactions = TXSResult.transactions;
    const totalTransactions = TXSResult.total;
    setTransactions(transactions);
    setLocalTransactions(totalTransactions);
  }, []);

  const handleSocketData = useCallback(
    (
      {
        list = [],
        height = 0,
        totalTxs,
        unconfirmedBlockHeight: unconfirmedHeight = '0',
        accountNumber = 0,
        dividends,
      }: SocketData,
      isFirst: boolean,
    ) => {
      let arr = list;
      if (!isFirst) {
        arr = list.filter((item) => {
          return item.block.Header.Height > blockHeight;
        });
      }
      arr.sort((pre, next) => next.block.Header.Height - pre.block.Header.Height);
      const new_transactions = arr.reduce((acc: SocketTxItem[], i) => acc.concat(i.txs), []).map(transactionFormat);
      const new_blocks = arr.map((item) => formatBlock(item.block));
      blockHeight = height;
      setUnconfirmedBlockHeight(unconfirmedHeight);
      setTransactions((v) => {
        const temp: TXItem = Object.fromEntries([...new_transactions, ...v].map((item) => [item.tx_id, item]));
        return Object.entries(temp)
          .map((item) => item[1])
          .sort((a, b) => b.block_height - a.block_height)
          .slice(0, 25) as TXItem[];
      });
      setBlocks((v) => {
        const temp = Object.fromEntries([...new_blocks, ...v].map((item) => [item.block_height, item]));
        return Object.entries(temp)
          .map((item) => item[1])
          .sort((a, b) => b.block_height - a.block_height)
          .slice(0, 25) as BlockItem[];
      });
      setLocalAccounts(accountNumber);
      setLocalTransactions(totalTxs);
      setReward(typeof dividends === 'string' ? JSON.parse(dividends) : dividends || {});
    },
    [],
  );

  const formatBlock = useCallback((block: FormatBlockDto) => {
    const { BlockHash, Header, Body } = block;
    return {
      block_hash: BlockHash,
      block_height: +Header.Height,
      chain_id: Header.ChainId,
      merkle_root_state: Header.MerkleTreeRootOfWorldState,
      merkle_root_tx: Header.MerkleTreeRootOfTransactions,
      pre_block_hash: Header.PreviousBlockHash,
      time: Header.Time,
      tx_count: Body.TransactionsCount,
      dividends: block.dividend,
      miner: block.miner,
    };
  }, []);

  return (
    <div className={'home-container basic-container-new ' + (isMobile ? 'mobile' : '')}>
      <section className="banner-section">
        <h2>AELF Explorer</h2>
        <Search />
        {isMobile && (
          <div className="price-info">
            <img src={TokenIcon} />
            <span className="price">$ {price.USD}</span>
            <span className={'range ' + (range >= 0 ? 'rise' : 'fall')}>
              {range >= 0 ? '+' : ''}
              {range.toFixed(2)}%
            </span>
          </div>
        )}
      </section>
      <div className="body-container">
        <section className="info-section">
          <ChainInfo
            blockHeight={blockHeight}
            localTransactions={localTransactions}
            reward={reward}
            unconfirmedBlockHeight={unconfirmedBlockHeight}
            localAccounts={localAccounts}
          />
        </section>
        <section className="latest-section">{latestSection}</section>
        <section className="chart-section">
          <h3>Transactions Per Minute</h3>
          <TPSChart own={tpsData.own} all={tpsData.all} />
        </section>
      </div>
    </div>
  );
}
