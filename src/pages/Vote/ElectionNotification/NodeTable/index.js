/*
 * @Author: Alfred Yang
 * @Github: https://github.com/cat-walk
 * @Date: 2019-12-07 17:42:20
 * @LastEditors: Alfred Yang
 * @LastEditTime: 2019-12-10 01:58:14
 * @Description: file content
 */
import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import { Table, Button, Input, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import moment from "moment";
// import Highlighter from 'react-highlight-words';
import io from "socket.io-client";

import {
  getAllTeamDesc,
  fetchPageableCandidateInformation,
  fetchElectorVoteWithRecords,
  fetchCount,
} from "@api/vote";
import { fetchCurrentMinerPubkeyList } from "@api/consensus";
import publicKeyToAddress from "@utils/publicKeyToAddress";
import { FROM_WALLET, ELF_DECIMAL } from "@src/pages/Vote/constants";
import { connect } from "react-redux";
import "./index.less";
import { SOCKET_URL_NEW } from "../../../../constants";
import addressFormat from "../../../../utils/addressFormat";
import TableLayer from "../../../../components/TableLayer/TableLayer";
import { isActivityBrowser } from "../../../../utils/isWebView";

const clsPrefix = "node-table";
const TableItemCount = 20;
class NodeTable extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      nodeList: [],
      totalVotesAmount: null,
      isLoading: false,
      producedBlocks: null,
      pagination: {
        showQuickJumper: true,
        total: 0,
        showTotal: (total) => `Total ${total} items`,
        pageSize: 20,
        showSizeChanger: false,
      },
    };
    this.socket = io({
      path: SOCKET_URL_NEW,
    });
  }

  // todo: how to combine cdm & cdu
  componentDidMount() {
    this.wsProducedBlocks();
    if (this.props.electionContract && this.props.consensusContract) {
      this.fetchNodes();
    }
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  componentDidUpdate(prevProps) {
    const {
      electionContract,
      consensusContract,
      currentWallet,
      nodeTableRefreshTime,
    } = this.props;
    if (
      (!prevProps.electionContract || !prevProps.consensusContract) &&
      electionContract &&
      consensusContract
    ) {
      console.log(1);
      this.fetchNodes();
    }
    if (nodeTableRefreshTime !== prevProps.nodeTableRefreshTime) {
      console.log(2);
      this.fetchNodes();
    }
    if (electionContract && consensusContract && currentWallet.address) {
      if (
        !prevProps.currentWallet.address ||
        currentWallet.address !== prevProps.currentWallet.address
      ) {
        console.log(3);
        this.fetchNodes();
      }
    }
  }

  wsProducedBlocks() {
    this.socket.on("produced_blocks", (data) => {
      this.setState({
        producedBlocks: data,
      });
      const { nodeList } = this.state;
      if (!nodeList || !nodeList.length) {
        return;
      }
      const newNodeList = nodeList.map((item) => {
        item.producedBlocks = data[item.pubkey];
        return item;
      });
      this.setState({
        nodeList: newNodeList,
      });
    });
  }

  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button
          onClick={() => this.handleReset(clearFilters, confirm)}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    // render: text => (
    //   <Highlighter
    //     highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
    //     searchWords={[this.state.searchText]}
    //     autoEscape
    //     textToHighlight={text.toString()}
    //   />
    // )
  });

  getWidth() {
    const width = document.body.offsetWidth;
    switch (true) {
      case width <= 1024:
        return 106;
      default:
        return 203;
    }
  }

  getCols() {
    const nodeListCols = [
      {
        title: "Rank",
        dataIndex: "rank",
        key: "rank",
        width: 70,
        defaultSortOrder: "ascend",
        sorter: (a, b) => a.rank - b.rank,
      },
      {
        title: "Node Name",
        dataIndex: "name",
        key: "nodeName",
        width: 200,
        ellipsis: true,
        // todo: ellipsis useless
        // ellipsis: true,
        render: (text, record) => (
          <Tooltip title={text}>
            <Link
              to={{ pathname: "/vote/team", search: `pubkey=${record.pubkey}` }}
            >
              {text}
            </Link>
          </Tooltip>
        ),
        ...this.getColumnSearchProps("name"),
      },
      {
        title: "Node Type",
        dataIndex: "nodeType",
        width: 90,
        key: "nodeType",
        // todo: write the sorter after the api is ready
        // sorter: (a, b) => a.nodeType - b.nodeType
      },
      {
        title: "Terms",
        dataIndex: "terms",
        width: 80,
        key: "terms",
        sorter: (a, b) => a.terms - b.terms,
      },
      {
        title: "Produce Blocks",
        dataIndex: "producedBlocks",
        width: 140,
        key: "producedBlocks",
        sorter: (a, b) => a.producedBlocks - b.producedBlocks,
      },
      {
        title: "Obtain Votes",
        dataIndex: "obtainedVotesAmount",
        width: 160,
        key: "obtainedVotesCount",
        sorter: (a, b) => a.obtainedVotesAmount - b.obtainedVotesAmount,
        render: (value) =>
          Number.parseFloat((value / ELF_DECIMAL).toFixed(2)).toLocaleString(),
      },
      {
        title: "Voted Rate",
        key: "votedRate",
        width: 108,
        dataIndex: "votedRate",
        render: (value) =>
          // <Progress percent={value} status="active" strokeColor="#fff" />
          `${value}%`,
        sorter: (a, b) => a.votedRate - b.votedRate,
      },
      {
        title: "My Votes",
        key: "myVotes",
        width: 100,
        dataIndex: "myTotalVoteAmount",
        sorter: (a, b) => {
          const myA = a.myTotalVoteAmount === "-" ? 0 : a.myTotalVoteAmount;
          const myB = b.myTotalVoteAmount === "-" ? 0 : b.myTotalVoteAmount;
          return myA - myB;
        },
        render: (value) => (value && value !== "-" ? value / ELF_DECIMAL : "-"),
      },
      {
        title: "Operations",
        key: "operations",
        width: this.getWidth(),
        fixed: "right",
        render: (text, record) => (
          <div className={`${clsPrefix}-btn-group`}>
            <Button
              className="table-btn vote-btn"
              key={record.pubkey}
              disabled={isActivityBrowser()}
              data-nodeaddress={record.formattedAddress}
              data-targetpublickey={record.pubkey}
              data-role="vote"
              data-nodename={record.name}
              data-shoulddetectlock
              data-votetype={FROM_WALLET}
            >
              Vote
            </Button>
            <Button
              className="table-btn redeem-btn"
              key={record.pubkey + 1}
              data-role="redeem"
              data-shoulddetectlock
              data-nodeaddress={record.formattedAddress}
              data-targetpublickey={record.pubkey}
              data-nodename={record.name}
              disabled={
                !(
                  record.myRedeemableVoteAmountForOneCandidate !== "-" &&
                  record.myRedeemableVoteAmountForOneCandidate > 0
                )
              }
            >
              Redeem
            </Button>
          </div>
        ),
      },
    ];

    // todo: Realize it using css
    // Hide operations on mobile
    // if (isSmallScreen) {
    //   nodeListCols.pop();
    // }

    nodeListCols.forEach((item) => {
      item.align = "center";
    });

    return nodeListCols;
  }

  handleSearch = (selectedKeys, confirm) => {
    confirm();
    // this.setState({ searchText: selectedKeys[0] });
  };

  // Must write in this way because of antd v4 bug.
  handleReset = (clearFilters, confirm) => {
    clearFilters();
    confirm();
  };

  async fetchTotal() {
    const res = await fetchCount(this.props.electionContract, "");
    const total = res?.value?.length || 0;
    const pagination = {
      // eslint-disable-next-line react/no-access-state-in-setstate
      ...this.state.pagination,
      total,
    };
    this.setState({
      pagination,
    });
    return total;
  }

  async fetchAllCandidateInfo() {
    const total = await this.fetchTotal();
    const { electionContract } = this.props;
    let start = 0;
    let result = [];
    while (start <= total) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchPageableCandidateInformation(electionContract, {
        start,
        length: TableItemCount,
      });
      result = result.concat(res ? res.value : []);
      start += 20;
    }
    return result;
  }

  async fetchCurrentRoundInformation() {
    const { consensusContract } = this.props;
    const res = await consensusContract.GetCurrentRoundInformation.call();
    return res;
  }

  async fetchElectorVote(currentWallet, electionContract) {
    const { publicKey, address } = currentWallet;
    if (!publicKey && !address) {
      return null;
    }
    let res;
    if (publicKey) {
      res = await fetchElectorVoteWithRecords(electionContract, {
        value: publicKey,
      });
    }
    if (!res) {
      res = await fetchElectorVoteWithRecords(electionContract, {
        value: address,
      });
    }
    return res || {};
  }

  // todo: the comment as follows maybe wrong, the data needs to share is the user's vote records
  // todo: consider to move the method to Vote comonent, because that also NodeTable and Redeem Modal needs the data;
  fetchNodes() {
    this.setState({
      isLoading: true,
    });
    const { electionContract, consensusContract, currentWallet } = this.props;
    Promise.all([
      this.fetchAllCandidateInfo(),
      this.fetchCurrentRoundInformation(),
      getAllTeamDesc(),
      this.fetchElectorVote(currentWallet, electionContract),
      fetchCurrentMinerPubkeyList(consensusContract),
    ])
      .then((resArr) => {
        // process data
        const processedNodesData = this.processNodesData(resArr);
        this.setState(
          {
            nodeList: processedNodesData,
          },
          () => {
            this.setState({
              isLoading: false,
            });
          }
        );
      })
      .catch((err) => {
        this.setState({
          isLoading: false,
        });
        console.error("GetPageableCandidateInformation", err);
      });
  }

  // eslint-disable-next-line class-methods-use-this
  processNodesData(resArr) {
    console.log(resArr, "resArr");
    const { producedBlocks } = this.state;
    let totalActiveVotesAmount = 0;
    const nodeInfos = resArr[0] || [];
    // need to count history and current
    const { realTimeMinersInformation } = resArr[1] || [];
    nodeInfos.forEach((ele) => {
      const history = +ele.candidateInformation.producedBlocks;
      const current =
        +realTimeMinersInformation[ele.candidateInformation.pubkey]
          ?.producedBlocks || 0;
      ele.candidateInformation.producedBlocks = history + current;
    });
    const { activeVotingRecords } = resArr[3] || {};
    let teamInfos = null;
    if (resArr[2].code === 0) {
      teamInfos = resArr[2].data;
    }
    const BPNodes = resArr[4].pubkeys;
    // add node name, add my vote amount
    nodeInfos.forEach((item) => {
      // compute totalActiveVotesAmount
      // FIXME: It will result in some problem when getPageable can only get 20 nodes info at most in one time
      totalActiveVotesAmount += +item.obtainedVotesAmount;
      // add node name
      const teamInfo = teamInfos.find(
        (team) => team.public_key === item.candidateInformation.pubkey
      );
      // get address from pubkey
      item.candidateInformation.address = publicKeyToAddress(
        item.candidateInformation.pubkey
      );
      item.candidateInformation.formattedAddress = addressFormat(
        item.candidateInformation.address
      );
      if (teamInfo === undefined) {
        // todo: use address instead after api modified
        item.candidateInformation.name =
          item.candidateInformation.formattedAddress;
      } else {
        item.candidateInformation.name = teamInfo.name;
      }

      // judge node type
      if (BPNodes.indexOf(item.candidateInformation.pubkey) !== -1) {
        item.candidateInformation.nodeType = "BP";
      } else {
        item.candidateInformation.nodeType = "Candidate";
      }
      // add my vote amount
      if (!activeVotingRecords) {
        item.candidateInformation.myTotalVoteAmount = "-";
        item.candidateInformation.myRedeemableVoteAmountForOneCandidate = "-";
        return;
      }
      // todo: use the method filterUserVoteRecordsForOneCandidate in voteUtil instead
      const myVoteRecordsForOneCandidate = activeVotingRecords.filter(
        (votingRecord) =>
          votingRecord.candidate === item.candidateInformation.pubkey
      );
      const myTotalVoteAmount = myVoteRecordsForOneCandidate.reduce(
        (total, current) => total + +current.amount,
        0
      );
      // todo: use the method computeUserRedeemableVoteAmountForOneCandidate in voteUtil instead
      const myRedeemableVoteAmountForOneCandidate = myVoteRecordsForOneCandidate
        .filter((record) => record.unlockTimestamp.seconds <= moment().unix())
        .reduce((total, current) => total + +current.amount, 0);

      item.candidateInformation.myTotalVoteAmount = myTotalVoteAmount || "-";
      item.candidateInformation.myRedeemableVoteAmountForOneCandidate =
        myRedeemableVoteAmountForOneCandidate || "-";
      if (producedBlocks) {
        item.candidateInformation.producedBlocks =
          producedBlocks[item.candidateInformation.pubkey];
      } else {
        item.candidateInformation.producedBlocks = 0;
      }
    });

    return nodeInfos
      .map((item) => {
        const votedRate =
          totalActiveVotesAmount === 0
            ? 0
            : (
                (item.obtainedVotesAmount / totalActiveVotesAmount) *
                100
              ).toFixed(2);
        return {
          ...item.candidateInformation,
          obtainedVotesAmount: item.obtainedVotesAmount,
          votedRate,
        };
      })
      .filter((item) => item.isCurrentCandidate)
      .sort((a, b) => b.obtainedVotesAmount - a.obtainedVotesAmount) // todo: is it accurate?
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        terms: item.terms.length,
      }));
  }

  fetchTotalVotesAmount() {
    const { electionContract } = this.props;

    electionContract.GetVotesAmount.call()
      .then((res) => {
        if (res === null) {
          this.setState({
            totalVotesAmount: 0,
          });
          return;
        }
        this.setState({
          totalVotesAmount: res.value,
        });
      })
      .catch((err) => {
        console.error("GetVotesAmount", err);
      });
  }

  render() {
    const { nodeList, isLoading, pagination } = this.state;
    const nodeListCols = this.getCols();
    return (
      <section className={`${clsPrefix}`}>
        <h2 className={`${clsPrefix}-header table-card-header`}>
          Node Table
          {/* <span className='node-color-intro-group'>
              <span className='node-color-intro-item'>BP节点</span>
              <span className='node-color-intro-item'>候选节点</span>
            </span> */}
          {/* <Search
              placeholder='输入节点名称'
              onSearch={value => console.log(value)}
            /> */}
          {/* <Button
            type='primary'
            onClick={() => {
              this.props.changeVoteState({
                shouldRefreshNodeTable: true
              });
            }}
          >
            Refresh
          </Button> */}
        </h2>
        <TableLayer className="node-table-wrapper">
          <Table
            showSorterTooltip={false}
            columns={nodeListCols}
            dataSource={nodeList}
            // onChange={handleTableChange}
            loading={isLoading}
            pagination={pagination}
            // cannot use publicKey, because publicKey will not change when updating producedBlocks
            rowKey={(record) => record.producedBlocks}
            scroll={{ x: 1024 }}
            // size='middle'
          />
        </TableLayer>
      </section>
    );
  }
}
const mapStateToProps = (state) => {
  const { currentWallet } = state.common;
  return {
    currentWallet,
  };
};
export default connect(mapStateToProps)(NodeTable);
