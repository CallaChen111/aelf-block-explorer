/**
 * @file
 * @author huangzongzhe  zhouminghui
 * 233333
 * TODO: Vote && Resource To migrate out of Application
 */

import React, { Component } from 'react';
import { message } from 'antd';
import { connect } from 'react-redux';
import { aelf } from 'utils/axios';
import { APPNAME, resourceTokens } from 'constants/config/config';
import DownloadPlugins from 'components/DownloadPlugins/DownloadPlugins';
import ResourceAElfWallet from './components/ResourceAElfWallet/ResourceAElfWallet';
import NightElfCheck from 'utils/NightElfCheck';
import getContractAddress from 'utils/getContractAddress';
import ResourceMoneyMarket from './components/ResourceMoneyMarket/ResourceMoneyMarket';
import getLogin from 'utils/getLogin';
import { isPhoneCheck } from 'utils/deviceCheck';
require('./Resource.less');

interface IState {
  currentWallet: any;
  contracts: any;
  tokenContract: any;
  tokenConverterContract: any;
  showDownloadPlugins: boolean;
  showWallet: boolean;
  currentBalance: number;
  resourceTokens: any;
  loading: boolean;
  nightElf: any;
  appName?: string;
}

const appName = APPNAME;
class Resource extends Component<any, IState> {
  informationTimer;
  walletRef;
  constructor(props) {
    super(props);
    this.informationTimer;
    this.state = {
      currentWallet: null,
      contracts: null,
      tokenContract: null,
      tokenConverterContract: null,
      showDownloadPlugins: false,
      showWallet: false,
      currentBalance: 0,
      resourceTokens: resourceTokens.map((v) => ({ ...v, balance: 0 })),
      loading: false,
      nightElf: null,
    };
    this.walletRef = null;
  }

  componentDidMount() {
    getContractAddress().then((result: any) => {
      this.setState({
        contracts: result,
      });
      if (!result.chainInfo) {
        message.error(
          'The chain has stopped or cannot be connected to the chain. Please check your network or contact us.',
          10,
        );
        return;
      }
      this.getContract(result);
    });

    NightElfCheck.getInstance()
      .check.then((item) => {
        if (item) {
          const nightElf = NightElfCheck.getAelfInstanceByExtension();
          if (nightElf) {
            this.setState({
              nightElf,
            });
            if (nightElf.getExtensionInfo) {
              nightElf.getExtensionInfo().then((info) => {
                if (!info.locked) {
                  nightElf.chain.getChainStatus().then((result) => {
                    this.loginAndInsertKeyPairs(result);
                  });
                } else {
                  localStorage.removeItem('currentWallet');
                }
              });
            } else {
              const wallet = JSON.parse(localStorage.getItem('currentWallet')!);
              if (wallet && new Date().valueOf() - Number(wallet.timestamp) < 15 * 60 * 1000) {
                nightElf.chain.getChainStatus().then((result) => {
                  this.loginAndInsertKeyPairs(result);
                });
              } else {
                localStorage.removeItem('currentWallet');
              }
            }
          }
        }
      })
      .catch((error) => {
        this.setState({
          showDownloadPlugins: true,
        });
      });
  }

  getContract(result) {
    aelf.chain.contractAt(result.multiToken, result.wallet, (error, result) => {
      this.setState({
        tokenContract: result,
      });
    });
    aelf.chain.contractAt(result.tokenConverter, result.wallet, (error, result) => {
      this.setState({
        tokenConverterContract: result,
      });
    });
  }

  loginAndInsertKeyPairs = (useLock = true, toastMessage = true) => {
    const { nightElf } = this.state;

    getLogin(
      nightElf,
      {},
      (result) => {
        if (result && result.error === 0) {
          localStorage.setItem(
            'currentWallet',
            JSON.stringify({
              ...JSON.parse(result.detail),
              timestamp: new Date().valueOf(),
            }),
          );
          const wallet = JSON.parse(result.detail);
          nightElf.chain.getChainStatus(() => {
            this.getNightElfKeyPair(wallet);
          });
          toastMessage && message.success('Login success!!', 3);
        } else {
          this.loginFailed();
        }
      },
      useLock,
    );
  };

  loginFailed(result?) {
    this.setState({
      showWallet: false,
    });
    const warningStr =
      (result && result.error === 200010 ? 'Please Login.' : result && result.errorMessage.message) ||
      'Please check your NightELF browser extension.';
    message.warn(warningStr);
  }

  getNightElfKeyPair(wallet) {
    if (wallet) {
      localStorage.setItem('currentWallet', JSON.stringify({ ...wallet, timestamp: new Date().valueOf() }));
      this.setState({
        currentWallet: wallet,
        showWallet: true,
      });
    }
  }

  getCurrentBalance = (value) => {
    this.setState({
      currentBalance: value,
    });
  };

  getDownloadPluginsHTML() {
    return <DownloadPlugins />;
  }

  onRefresh() {
    setTimeout(() => {
      this.walletRef.refreshWalletInfo();
    }, 2000);
    this.setState({
      loading: true,
    });
  }

  endRefresh() {
    this.setState({
      loading: false,
    });
  }

  getResource = (resource) => {
    this.setState({
      resourceTokens: resource.map((v) => ({ ...v })),
    });
  };

  resourceAElfWalletHtml() {
    const { tokenContract, currentWallet, resourceTokens, currentBalance } = this.state;
    return (
      <ResourceAElfWallet
        title="AELF Wallet"
        ref={(wallet) => {
          this.walletRef = wallet;
        }}
        tokenContract={tokenContract}
        currentWallet={currentWallet}
        getCurrentBalance={this.getCurrentBalance}
        getResource={this.getResource}
        resourceTokens={resourceTokens}
        balance={currentBalance}
        loginAndInsertKeyPairs={this.loginAndInsertKeyPairs}
      />
    );
  }

  render() {
    const {
      currentBalance,
      appName,
      showDownloadPlugins,
      currentWallet,
      contracts,
      tokenContract,
      tokenConverterContract,
      nightElf,
      resourceTokens,
    } = this.state;
    const account = {
      balance: currentBalance,
      resourceTokens,
    };
    let downloadPlugins: any = null;
    if (showDownloadPlugins) {
      // eslint-disable-next-line react/jsx-key
      downloadPlugins = [this.getDownloadPluginsHTML(), <div className="resource-blank" />];
    }
    const resourceAElfWalletHtml = this.resourceAElfWalletHtml();
    const isPhone = isPhoneCheck();
    return (
      <div className="resource-body basic-container basic-container-white">
        {!isPhone && downloadPlugins}
        {nightElf && resourceAElfWalletHtml}
        <div className="resource-money-market">
          <ResourceMoneyMarket
            loginAndInsertKeypairs={this.loginAndInsertKeyPairs}
            currentWallet={currentWallet}
            contracts={contracts}
            tokenContract={tokenContract}
            tokenConverterContract={tokenConverterContract}
            account={account}
            onRefresh={this.onRefresh.bind(this)}
            endRefresh={this.endRefresh.bind(this)}
            nightElf={nightElf}
            walletRef={this.walletRef}
            appName={appName}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.common,
});

export default connect(mapStateToProps)(Resource);
