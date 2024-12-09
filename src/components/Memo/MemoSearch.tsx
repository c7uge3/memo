import { useState, useTransition, useDeferredValue, useEffect } from "react";
import { useSetAtom } from "jotai";
import { searchValueAtom } from "../../util/atoms";

/**
 * 搜索组件，用于搜索 memo
 * @returns 搜索组件
 */
const MemoSearch: React.FC = () => {
  const [inputValue, setInputValue] = useState(""); // 输入值
  const deferredValue = useDeferredValue(inputValue);
  const setSearchValue = useSetAtom(searchValueAtom); // Jotai 设置搜索值
  const [isPending, startTransition] = useTransition();

  // 使用 deferredValue 处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchValue(deferredValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [deferredValue, setSearchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isPending) {
      startTransition(() => {
        setSearchValue(inputValue);
      });
    }
  };

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
