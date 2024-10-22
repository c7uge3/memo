import React, { useState, useTransition } from "react";
import { useSetAtom } from "jotai";
import { searchValueAtom } from "./atoms";

/**
 * 搜索组件，用于搜索 memo
 * @returns 搜索组件
 */
const MemoSearch: React.FC = () => {
  const [inputValue, setInputValue] = useState(""); // 输入值
  const setSearchValue = useSetAtom(searchValueAtom); // Jotai 设置搜索值
  const [, startTransition] = useTransition();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      startTransition(() => {
        setSearchValue(inputValue);
      });
    }
  };

  const clearSearchText = () => {
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
        <label className='fa-clear' onClick={clearSearchText}>
          ✖
        </label>
      )}
    </span>
  );
};

export default MemoSearch;
