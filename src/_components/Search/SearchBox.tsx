/*
 * @Author: aelf-lxy
 * @Date: 2023-08-03 14:20:36
 * @LastEditors: aelf-lxy
 * @LastEditTime: 2023-08-17 15:12:38
 * @Description: Search component
 */
'use client';
// import request from '@_api';
import { useState, useRef, MouseEvent, memo, isValidElement, useMemo } from 'react';
import clsx from 'clsx';
import Panel from './Panel';
import SearchSelect from './Select';
import { useUpdateDataByQuery, useSelected, useHighlight } from '@_hooks/useSearch';
import { ISearchProps } from './type';
import { useSearchContext } from './SearchProvider';
import { setQuery, setClear } from './action';
import { Button, Modal, Flex } from 'antd';
import { Typography } from 'aelf-design';
import IconFont from '@_components/IconFont';

const { Title } = Typography;

const randomId = () => `searchbox-${(0 | (Math.random() * 6.04e7)).toString(36)}`;

const Search = ({
  pageThemeMode,
  modalThemeMode,
  size,
  isMobile,
  searchValidator,
  placeholder,
  searchButton,
  onSearchButtonClickHandler,
  searchIcon,
  deleteIcon,
  searchWrapClassNames,
}: ISearchProps) => {
  // Global state from context
  const { state, dispatch } = useSearchContext();
  const { query, selectedItem, highLight, canShowListBox } = state;

  // Component state
  const [hasFocus, setHasFocus] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // DOM references
  const queryInput = useRef<HTMLInputElement>(null);
  const modalQueryInput = useRef<HTMLInputElement>(null);

  const currentQueryInput = useMemo(() => (isModalOpen ? modalQueryInput : queryInput), [isModalOpen]);

  // Calculated states
  const isExpanded = hasFocus && canShowListBox;
  const hasClearButton = !!query && deleteIcon;

  useUpdateDataByQuery();
  useSelected(selectedItem, currentQueryInput);
  useHighlight(highLight, currentQueryInput);

  function cancelBtnHandler(e?: MouseEvent<HTMLElement>) {
    e?.preventDefault();
    currentQueryInput.current!.value = '';
    dispatch(setClear());
  }

  const onSearchHandler = () => {
    onSearchButtonClickHandler && onSearchButtonClickHandler(currentQueryInput.current!.value);
  };

  const renderSearchInputWrap = ({ isInModal = false }: { isInModal?: boolean } = {}) => {
    return (
      <div className="search-input-wrap">
        {searchIcon && (
          <div className="search-input-query-icon">
            <IconFont type="search" />
          </div>
        )}
        <input
          className="search-input"
          ref={isInModal ? modalQueryInput : queryInput}
          placeholder={placeholder}
          onFocus={() => {
            if (isInModal) {
              return;
            }
            if (isMobile) {
              setIsModalOpen(true);
              queryInput.current?.blur();
              setTimeout(() => {
                modalQueryInput.current?.focus();
              }, 100);
            } else {
              setHasFocus(true);
            }
          }}
          onBlur={() => {
            if (isInModal) {
              return;
            }
            setHasFocus(false);
          }}
          onChange={(e) => {
            dispatch(setQuery(e.target.value));
          }}
        />
        {hasClearButton && (
          <div className="search-input-clear" onMouseDown={cancelBtnHandler}>
            <IconFont type="clear" />
          </div>
        )}
      </div>
    );
  };

  function renderButton() {
    if (!searchButton) {
      return null;
    }
    if (isValidElement(searchButton)) {
      return <div onClick={onSearchHandler}>{searchButton}</div>;
    }
    return (
      <Button
        className="search-button"
        type="primary"
        icon={<IconFont className="search-button-icon" type="search" />}
        onClick={onSearchHandler}
      />
    );
  }

  return (
    <>
      <div
        className={clsx(
          'searchbox-wrap',
          searchWrapClassNames,
          `searchbox-wrap-${pageThemeMode}`,
          `searchbox-wrap-${size}`,
        )}
        aria-expanded={isExpanded}>
        <SearchSelect searchValidator={searchValidator} />
        {renderSearchInputWrap()}
        {renderButton()}
        {isExpanded && <Panel id={randomId()} searchHandler={onSearchHandler} />}
      </div>
      <Modal
        className={clsx(
          'searchbox-modal-wrap',
          `searchbox-modal-wrap-${modalThemeMode}`,
          `searchbox-modal-wrap-${size}`,
        )}
        open={isModalOpen}
        footer={null}
        closable={false}>
        <Flex className="searchbox-modal-header" align="center" gap={8}>
          <div className="search-wrap">
            {renderSearchInputWrap({ isInModal: true })}
            {renderButton()}
          </div>
          <Title
            className="cancel-text"
            onClick={() => {
              cancelBtnHandler();
              setIsModalOpen(false);
            }}>
            Cancel
          </Title>
        </Flex>
        <Panel id={randomId()} searchHandler={onSearchHandler} isInModal />
      </Modal>
    </>
  );
};
export default memo(Search);
