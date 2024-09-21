import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { toast, Zoom } from "react-toastify";
import useSWR, { mutate } from "swr";
import axios from "axios";

import Empty from "../Common/emptyBox";
import { API_GET_MEMO, API_DELETE_MEMO } from "../../util/apiURL";
import { searchValueAtom, memoCountAtom } from "./atoms";

import "../Common/emptyBox/style/index.less";
import "../Common/loading/style/index.less";

// memo 数据类型
interface MemoItem {
  _id: string;
  createdAt: string;
  message: string;
}

// List 组件的 props
interface ListProps {
  listHeight: number;
}

/**
 * List 组件，用于渲染 memo 列表
 * @param props：ListProps，包含 listHeight
 * @returns memo 列表
 */
function List({ listHeight }: ListProps) {
  const [searchValue] = useAtom(searchValueAtom); // 搜索值
  const [operateFlag, setOperateFlag] = useState<boolean>(false); // 删除按钮的显示状态
  const [crtKey, setCrtKey] = useState<number | undefined>(undefined); // 当前操作的 key
  const setMemoCount = useSetAtom(memoCountAtom); // Jotai 管理 memoCount 状态

  // 设置 toast 对象，用于显示 toast 消息
  const toastObj = useMemo(
    () => ({
      transition: Zoom,
      autoClose: 1000,
    }),
    [] // 只在组件挂载和卸载时执行
  );

  // 获取 memo列表，使用 SWR 管理数据
  const fetcher = async ([url, message]: [string, string]): Promise<
    MemoItem[]
  > => {
    const { data } = await axios.get(url, { params: { message } });
    return data.data;
  };

  // 使用 SWR 获取 memo 列表
  const { data: listData, error } = useSWR<MemoItem[], Error>(
    [API_GET_MEMO, searchValue],
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: true,
      dedupingInterval: 1000,
      focusThrottleInterval: 1000,
      revalidateOnMount: false,
    }
  );

  /**
   * MemoItem 组件，用于渲染单个 memo
   * @param props：MemoItemProps，包含memo数据和索引
   * @returns 单条 memo
   */
  const MemoItem = React.memo(
    ({ item, index }: { item: MemoItem; index: number }) => {
      const { _id, createdAt, message } = item;
      const canOperate = operateFlag && index === crtKey;

      return (
        <li
          className='memoCard-li'
          onMouseEnter={() => isNeedOperate("Y", index)}
          onMouseLeave={() => isNeedOperate("n", index)}>
          <label className='memoTime-label'>{createdAt}</label>
          {canOperate && (
            <label className='operate-label' onClick={() => deleteMemo(_id)}>
              ✖
            </label>
          )}
          <div
            className='memoCard-div'
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </li>
      );
    }
  );

  /**
   * 删除 memo
   * @param id：memo 的 id
   * @returns 删除 memo 后的结果
   */
  const deleteMemo = useCallback(async (id: string) => {
    try {
      const { data } = await axios.delete(API_DELETE_MEMO, { data: { id } });
      if (data.success) {
        toast.success("删除成功", toastObj);
        if (listData) setMemoCount(listData.length - 1);
        mutate([API_GET_MEMO, searchValue]);
      } else {
        toast.error("删除失败", toastObj);
      }
    } catch (e) {
      toast.error(`🦄 ${e}`, toastObj);
    }
  }, []);

  // 设置 operateFlag 和 crtKey
  const isNeedOperate = useCallback((flag: string, key: number) => {
    setOperateFlag(flag === "Y");
    setCrtKey(key);
  }, []);

  // 设置 memo 数量，并重新获取memo列表
  useEffect(() => {
    if (listData) {
      setMemoCount(listData.length);
    }
  }, [listData, searchValue]); // 任一依赖项产生变化，重新获取 memo 列表

  return (
    <>
      {error ? (
        <div style={{ textAlign: "center" }}>加载失败，请稍等或稍后再试</div>
      ) : (
        <ul className='memoCard-ul' style={{ height: listHeight }}>
          {listData && listData.length > 0 ? (
            listData.map((item, index) => (
              <MemoItem key={item._id} item={item} index={index} />
            ))
          ) : (
            <li className='memoCard-li'>
              <Empty isShow={true} />
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export default memo(List);
