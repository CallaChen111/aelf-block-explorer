/**
 * @file chain info
 * @author atom-yang
 */
import React, { useState, useMemo } from "react";
import PropTypes from 'prop-types';
import {
    Row,
    Col,
    Card,
    Divider
} from "antd";
import { CHAIN_ID } from '@src/constants';
import './index.less';
import Arrow from "../../../components/Arrow";

const gutter = [
    {
        sm: 16,
        md: 16
    },
    {
        sm: 16,
        md: 16
    }
];

function DividendItem(props) {
    const {
        symbol,
        amount
    } = props;
    return (
        <>
            <h4 className="home-chain-info-sub-title">{symbol}</h4>
            <p className="home-chain-info-text text-ellipsis" title={amount && amount.toLocaleString()}>
                {amount && amount.toLocaleString()}
            </p>
        </>
    );
}

const defaultDividends = {
    ELF: 0
};

const ChainInfo = props => {
    const {
        chainId,
        blockHeight,
        unconfirmedBlockHeight,
        totalAccounts,
        totalTxs,
        localAccounts,
        localTxs,
        dividends
    } = props;
    const mergedDividends = {
        ...defaultDividends,
        ...dividends
    };
    const dividendsKeys = useMemo(() => Object.keys(mergedDividends), [
        dividends
    ]);

    const [currentArrowPage, setArrowPage] = useState(1);

    function pre() {
        setArrowPage(currentArrowPage - 1);
    }

    function next() {
        setArrowPage(currentArrowPage + 1);
    }

    return (
        <Row className="home-chain-info" gutter={gutter}>
            <Col sm={12} md={8}>
                <Card  className="gap-bottom" title="Block Height" bordered={false}>
                    <p className="home-chain-info-text text-ellipsis">{blockHeight && blockHeight.toLocaleString()}</p>
                </Card>
                <Card title="Unconfirmed Blocks" bordered={false}>
                    <p className="home-chain-info-text text-ellipsis">{unconfirmedBlockHeight && unconfirmedBlockHeight.toLocaleString()}</p>
                </Card>
            </Col>
            <Col sm={12} md={8}>
                <Card title="Total Transactions" className="home-chain-info-min-height" bordered={false}>
                    <h4 className="home-chain-info-sub-title">All Chains</h4>
                    <p className="home-chain-info-text text-ellipsis">{totalTxs && totalTxs.toLocaleString()}</p>
                    <Divider />
                    <h4 className="home-chain-info-sub-title">{chainId} Chain</h4>
                    <p className="home-chain-info-text text-ellipsis">{localTxs && localTxs.toLocaleString()}</p>
                </Card>
            </Col>
            <Col sm={12} md={8}>
                <Card title="Total Accounts" className="home-chain-info-min-height" bordered={false}>
                    <h4 className="home-chain-info-sub-title">All Chains</h4>
                    <p className="home-chain-info-text text-ellipsis">{totalAccounts && totalAccounts.toLocaleString()}</p>
                    <Divider />
                    <h4 className="home-chain-info-sub-title">{chainId} Chain</h4>
                    <p className="home-chain-info-text text-ellipsis">{localAccounts && localAccounts.toLocaleString()}</p>
                </Card>
            </Col>
        </Row>
    );
};

ChainInfo.propTypes = {
  chainId: PropTypes.string,
  blockHeight: PropTypes.number.isRequired,
  unconfirmedBlockHeight: PropTypes.number.isRequired,
  totalTxs: PropTypes.number.isRequired,
  localTxs: PropTypes.number.isRequired,
  totalAccounts: PropTypes.number.isRequired,
  localAccounts: PropTypes.number.isRequired,
  dividends: PropTypes.object.isRequired
};

ChainInfo.defaultProps = {
    chainId: CHAIN_ID
}

export default React.memo(ChainInfo);
