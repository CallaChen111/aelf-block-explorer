/*
 * @Author: aelf-lxy
 * @Date: 2023-08-11 00:15:47
 * @LastEditors: Peterbjx
 * @LastEditTime: 2023-08-16 16:02:54
 * @Description: root of search component
 */
import { SearchContextProvider } from './SearchProvider';
import { ISearchProps, SearchSize, SearchThemeMode } from './type';
import SearchBox from './SearchBox';

const propDefaults = {
  placeholder: '',
  searchIcon: false,
  searchButton: true,
  deleteIcon: true,
  isMobile: false,
  pageThemeMode: SearchThemeMode.HOME,
  modalThemeMode: SearchThemeMode.MAIN,
  pageSearchSize: SearchSize.MEDIUM,
  modalSearchSize: SearchSize.MEDIUM,
};
export default function Search(props: ISearchProps) {
  const componentProps = { ...propDefaults, ...props };
  return (
    <SearchContextProvider validator={props.searchValidator}>
      <SearchBox {...componentProps} />
    </SearchContextProvider>
  );
}
