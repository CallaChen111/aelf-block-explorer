import { Pagination, Spin, Table } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDebounce } from 'react-use';
import clsx from 'clsx';
import { VIEWER_EVENT_LIST } from 'constants/viewerApi';
import EventItem from 'components/EventItem';
import TableLayer from 'components/TableLayer/TableLayer';
import useMobile from 'hooks/useMobile';
import { get } from 'utils/axios';

require('./Events.styles.less');

export default function Events() {
  const { address } = useRouter().query;
  const isMobile = useMobile();
  const [total, setTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState(undefined);
  console.log(dataSource, 'dataSource');
  const columns = useMemo(
    () => [
      {
        title: 'Txn Hash',
        width: 192,
        ellipsis: true,
        dataIndex: 'txId',
        className: 'color-blue',
        render(txId) {
          return <Link href={`/tx/${txId}`}>{txId}</Link>;
        },
      },
      { title: 'Method', width: 196, ellipsis: true, dataIndex: 'name' },
      {
        title: 'Logs',
        dataIndex: 'data',
        render(data, record) {
          return <EventItem Indexed={data.Indexed} NonIndexed={data.NonIndexed} Name={record.name} Address={address} />;
        },
      },
    ],
    [],
  );
  const fetchEvents = useCallback(async () => {
    const result = await get(VIEWER_EVENT_LIST, {
      pageSize,
      pageNum: pageIndex,
      address,
    });
    setDataLoading(false);
    if (result.code === 0) {
      setDataSource(result.data.list);
      setTotal(result.data.total);
    }
  }, [address, pageIndex, pageSize]);

  const handlePageChange = useCallback(
    (page, size) => {
      setDataSource(undefined);
      setDataLoading(true);
      setPageIndex(size === pageSize ? page : 1);
      setPageSize(size);
    },
    [pageSize],
  );

  useDebounce(
    () => {
      fetchEvents();
    },
    1000,
    [pageIndex, pageSize],
  );

  return (
    <div className={clsx('events-pane', isMobile && 'mobile')}>
      {isMobile ? (
        <div className="list">
          {dataLoading ? (
            <Spin />
          ) : (
            dataSource?.map((item) => (
              <div className="row" key={item.name}>
                <p>
                  <span className="label">Txn Hash</span>
                  <span className="value">
                    <Link href={`/tx/${item.txId}`}>{item.txId}</Link>
                  </span>
                </p>
                <p>
                  <span className="label">Method</span>
                  <span className="value">{item.name}</span>
                </p>
                <p>
                  <span className="label">Logs</span>
                  <EventItem
                    Indexed={item.data.Indexed}
                    NonIndexed={item.data.NonIndexed}
                    Name={item.name}
                    Address={address}
                  />
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <TableLayer>
          <Table columns={columns} pagination={false} dataSource={dataSource} loading={dataLoading} rowKey="id" />
        </TableLayer>
      )}
      <div className="after-table">
        <Pagination
          showLessItems={isMobile}
          showSizeChanger
          current={pageIndex}
          pageSize={pageSize}
          total={total}
          pageSizeOptions={['10', '25', '50', '100']}
          onChange={handlePageChange}
          onShowSizeChange={(current, size) => handlePageChange(1, size)}
        />
      </div>
    </div>
  );
}
