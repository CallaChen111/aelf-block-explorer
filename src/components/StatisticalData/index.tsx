/*
 * @Author: AbigailDeng Abigail.deng@ienyan.com
 * @Date: 2022-09-29 17:14:01
 * @LastEditors: AbigailDeng Abigail.deng@ienyan.com
 * @LastEditTime: 2022-10-28 15:17:36
 * @FilePath: /aelf-block-explorer/src/components/StatisticalData/index.tsx
 * @Description: file content
 */

import React, { PureComponent } from 'react';
import { Tooltip, Statistic, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { IProps, IState } from './types';
require('./index.less');

const { Countdown } = Statistic;
const clsPrefix = 'statistical-data';

const arrFormate = function (arr) {
  switch (arr.length) {
    case 4:
      // eslint-disable-next-line no-return-assign, no-param-reassign
      arr.forEach((item, index) => (item.span = 8 - 4 * (index % 2)));
      break;
    default:
      // eslint-disable-next-line no-return-assign, no-param-reassign
      arr.forEach((item) => (item.span = 24 / arr.length));
      break;
  }
  return arr;
};

export default class StatisticalData extends PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      arr: [],
    };
  }

  componentDidMount() {
    const { data } = this.props;
    this.setState({
      arr: Object.values(data),
    });
  }

  componentDidUpdate(prevProps) {
    const { data } = this.props;

    if (prevProps.data !== data) {
      this.setState({
        arr: Object.values(data),
      });
    }
  }

  handleFinish(id) {
    const { arr } = this.state;
    // TODO: limit the data's type to object
    const countdown = arr.find((item) => item.id === id)!;
    countdown.num = Date.now() + countdown.resetTime;
    this.setState({ arr: [...arr] });
    // TODO: update the current term number at the same time
  }

  renderList(arr) {
    return arr.map((item, index) => {
      const number = item.num;
      if (item.isRender) {
        return item.num;
      }
      return item.isCountdown ? (
        <Countdown
          key={index}
          title={item.title}
          value={item.num || 0}
          format="D day HH : mm : ss "
          onFinish={() => {
            this.handleFinish(item.id);
          }}
        />
      ) : (
        <Statistic key={index} title={item.title} value={isNaN(parseInt(number, 10)) ? 0 : number} />
      );
    });
  }

  render() {
    const { spinning = false, style, tooltip, inline } = this.props;
    const { arr } = this.state;
    if (!arr) return null;

    const arrFormatted = arrFormate(arr);
    const listHTML = this.renderList(arrFormatted);

    return (
      <section style={style}>
        <Spin spinning={spinning}>
          <section className={`${clsPrefix}-container ${inline ? 'inline-style' : ''}`}>
            {tooltip ? (
              <Tooltip title={tooltip}>
                <ExclamationCircleOutlined style={{ fontSize: 20 }} />
              </Tooltip>
            ) : null}
            {listHTML}
          </section>
        </Spin>
      </section>
    );
  }
}
