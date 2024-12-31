/**
 * MemoSearch 模块
 * 提供备忘录搜索功能组件
 * @module MemoSearch
 */

import { useState, useTransition, useDeferredValue, useEffect } from "react";
import { useSetAtom, useAtom } from "jotai";
import { searchValueAtom, selectedDateAtom } from "../../util/atoms";

/**
 * 搜索组件
 * 使用 useDeferredValue 和 useTransition 优化性能
 * @returns React 组件
 */
const MemoSearch: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const deferredValue = useDeferredValue(inputValue);
  const setSearchValue = useSetAtom(searchValueAtom);
  const [, setSelectedDate] = useAtom(selectedDateAtom);
  const [isPending, startTransition] = useTransition();

  /**
   * 使用 useDeferredValue 处理搜索，减少不必要的重渲染
   * 当搜索值变化时，使用防抖处理并更新全局状态
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (deferredValue) {
        startTransition(() => {
          // 如果有搜索内容，先清空日期筛选
          setSelectedDate(null);
          // 然后设置搜索值
          setSearchValue(deferredValue);
        });
      } else {
        setSearchValue("");
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [deferredValue, setSearchValue, setSelectedDate]);

  /**
   * 处理输入框值变化
   * @param e - 输入事件对象
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  /**
   * 处理键盘事件
   * 当按下回车键时执行搜索
   * @param e - 键盘事件对象
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isPending) {
      startTransition(() => {
        // 如果有搜索内容，先清空日期筛选
        if (inputValue) {
          setSelectedDate(null);
        }
        // 然后设置搜索值
        setSearchValue(inputValue);
      });
    }
  };

  /**
   * 清除搜索文本
   * 如果正在执行搜索，则不执行清除操作
   */
  const clearSearchText = () => {
    if (isPending) return;
    setInputValue("");
    startTransition(() => {
      setSearchValue("");
    });
  };

  return (
    <span className='ipt-span'>
      <input
        type='text'
        placeholder='搜索一下...'
        className='ipt-input'
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <label className='fa-search'>🔍</label>
      {inputValue && (
        <label
          className={`fa-clear ${
            isPending ? "disabled" : ""
          } operate-label delete`}
          onClick={clearSearchText}>
          ✖
        </label>
      )}
    </span>
  );
};

export default MemoSearch;
