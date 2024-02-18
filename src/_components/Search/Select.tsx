/*
 * @Author: aelf-lxy
 * @Date: 2023-08-09 20:35:48
 * @LastEditors: aelf-lxy
 * @LastEditTime: 2023-08-17 14:41:44
 * @Description: filter condition
 */
import { Dropdown, MenuProps } from 'antd';
import { TSearchValidator } from './type';
import IconFont from '@_components/IconFont';
import { ReactElement, cloneElement, memo, useState } from 'react';
import { useSearchContext } from './SearchProvider';
import { setFilterType } from './action';
import clsx from 'clsx';

function SearchSelect({ searchValidator }: { searchValidator?: TSearchValidator }) {
  const { state, dispatch } = useSearchContext();
  const { filterType } = state;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!searchValidator || Object.keys(searchValidator).length === 0) {
    return null;
  }

  const items = searchValidator.map((ele) => ({ label: ele.label, key: ele.key }));

  const filterClickHandler: MenuProps['onClick'] = (obj) => {
    setIsDropdownOpen(false);
    dispatch(setFilterType(searchValidator[obj.key]));
  };
  return (
    <Dropdown
      // open={true}
      trigger={['click']}
      placement="bottom"
      menu={{ items, onClick: filterClickHandler, selectable: true, defaultSelectedKeys: ['0'] }}
      dropdownRender={(menu) => (
        <div>
          {cloneElement(menu as ReactElement, {
            className: 'search-filter-menu-wrap',
          })}
        </div>
      )}
      onOpenChange={(open) => setIsDropdownOpen(open)}>
      <div className="filter-wrap">
        <div className="filter-label">{filterType?.label}</div>
        <IconFont className={clsx('right-arrow', isDropdownOpen && 'rotate-180')} type="Down" />
      </div>
    </Dropdown>
  );
}

export default memo(SearchSelect);
