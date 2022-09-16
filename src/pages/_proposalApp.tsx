/**
 * @file App container
 * @author atom-yang
 */
import type { AppProps } from 'next/app';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import useUseLocation from 'react-use/lib/useLocation';
import { useSelector, useDispatch } from 'react-redux';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Tabs, Popover } from 'antd';
import { logIn, LOG_IN_ACTIONS } from 'redux/features/proposal/common';
import LogButton from 'page-components/Proposal/Log';
import { LOG_STATUS } from 'constants/info';
import { walletInstanceSingle } from 'page-components/Proposal/common/wallet';
import Plugin from 'components/plugin';
import Rules from 'page-components/Proposal/Rules';
import { isPhoneCheck } from 'utils/deviceCheck';
import { sendMessage } from 'utils/utils';
import { commonAction } from 'redux/features/proposal/common';

const { TabPane } = Tabs;

const ROUTES_UNDER_TABS = {
  proposals: ['proposals', 'proposalDetails'],
  organizations: ['organizations', 'createOrganizations'],
  apply: ['apply'],
  myProposals: ['myProposals'],
};

function useRouteMatch(path) {
  const pathKey = path.split('/')[2];
  const [result] = Object.values(ROUTES_UNDER_TABS).find((tab) => tab.find((item) => item === pathKey)) || [
    'proposals',
  ];
  return result;
}

export const RouterComponent = (options) => {
  const router = useRouter();
  const logStatus = useSelector((state) => state.common.logStatus);
  const isLogged = useMemo(() => logStatus === LOG_STATUS.LOGGED, [logStatus, options]);
  const target = useMemo(() => {
    if (isLogged) {
      return options.target;
    }
    if (options.default) {
      router.replace(options.default);
    }
  }, [isLogged, options]);
  return target;
};

const App = (pageProps: AppProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const logStatus = useSelector((state) => state.common.logStatus);
  const [isExist, setIsExist] = useState(true);
  const { pathname } = window.location;
  const tabKey = useRouteMatch(pathname);
  const { href } = useUseLocation();

  const isLogged = useMemo(() => logStatus === LOG_STATUS.LOGGED, [logStatus]);

  useEffect(() => {
    sendMessage({
      href,
    });
  }, [href]);

  useEffect(() => {
    walletInstanceSingle()
      .isExist?.then((result) => {
        const wallet = JSON.parse(localStorage.getItem('currentWallet'));
        const timeDiff = wallet ? new Date().valueOf() - Number(wallet.timestamp) : 15 * 60 * 1000;

        setIsExist(result);
        if (!result) {
          dispatch(
            commonAction({
              type: LOG_IN_ACTIONS.LOG_IN_FAILED,
              payload: {},
            }),
          );
        } else if (typeof walletInstanceSingle().proxy.elfInstance.getExtensionInfo === 'function') {
          walletInstanceSingle()
            .getExtensionInfo()
            .then((info) => {
              if (!info.locked) {
                dispatch(logIn());
              } else {
                localStorage.removeItem('currentWallet');
                dispatch(
                  commonAction({
                    type: LOG_IN_ACTIONS.LOG_IN_FAILED,
                    payload: {},
                  }),
                );
              }
            });
        } else if (timeDiff < 15 * 60 * 1000) {
          dispatch(logIn());
        } else {
          localStorage.removeItem('currentWallet');
          dispatch(
            commonAction({
              type: LOG_IN_ACTIONS.LOG_IN_FAILED,
              payload: {},
            }),
          );
        }
      })
      .catch(() => {
        setIsExist(false);
      });
  }, []);
  const handleTabChange = (key) => {
    router.push(`/proposal/${key}`);
  };
  return (
    <div className="proposal">
      {isExist ? null : <Plugin />}
      <Tabs
        defaultActiveKey={tabKey}
        activeKey={tabKey}
        onChange={handleTabChange}
        tabBarExtraContent={
          <>
            <Popover content={<Rules />} placement="bottom">
              <span className="gap-right-small">
                <ExclamationCircleOutlined className={isPhoneCheck() ? 'main-color' : 'gap-right-small main-color'} />
                {isPhoneCheck() ? ' Rule' : 'Proposal Rules'}
              </span>
            </Popover>
            <LogButton isExist={!!isExist} />
          </>
        }>
        <TabPane tab="Proposals" key="proposals" />
        {isLogged && <TabPane tab="Apply" key="apply" />}
        <TabPane tab="Organizations" key="organizations" />
        {isLogged && <TabPane tab="My Proposals" key="myProposals" />}
      </Tabs>
      <div className="proposal-container">
        <RouterComponent target={<pageProps.Component {...pageProps} />} default={pageProps.default}></RouterComponent>
      </div>
    </div>
  );
};

export default App;
