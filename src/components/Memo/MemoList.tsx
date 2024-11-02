import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAtom } from "jotai";
import { Zoom } from "react-toastify";
import useSWR from "swr";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import Empty from "../Common/emptyBox";
import MemoItem from "./MemoItem";
import { API_GET_MEMO } from "../../util/apiURL";
import {
  searchValueAtom,
  memoCountAtom,
  memoDataAtom,
  selectedDateAtom,
} from "../../util/atoms";

import "../Common/emptyBox/style/index.less";
import "../Common/loading/style/index.less";

interface MemoItem {
  _id: string;
  createdAt: string;
  message: string;
}

interface ListProps {
  listHeight: number;
}

const TIMEZONE = "Asia/Shanghai";

const MemoList: React.FC<ListProps> = ({ listHeight }) => {
  const [searchValue] = useAtom(searchValueAtom);
  const [operateFlag, setOperateFlag] = useState<boolean>(false);
  const [crtKey, setCrtKey] = useState<number | undefined>(undefined);
  const [, setMemoCount] = useAtom(memoCountAtom);

  const toastObj = useMemo(
    () => ({
      transition: Zoom,
      autoClose: 1000,
    }),
    []
  );

  const { user } = useAuth0();
  const userId = user?.sub;

  const [, setMemoData] = useAtom(memoDataAtom);

  const fetcher = useCallback(
    async ([url, message, userId]: [string, string, string]): Promise<
      MemoItem[]
    > => {
      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await axios.get(url, {
            params: { message, userId },
            timeout: 30000,
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          if (!response.data.success) {
            throw new Error(response.data.message || "请求失败");
          }

          return response.data.data;
        } catch (error: any) {
          lastError = error;
          console.error(`Attempt ${attempt + 1} failed:`, error);

          // 如果不是最后一次尝试，等待后重试
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
            continue;
          }

          // 处理特定错误
          if (axios.isCancel(error)) {
            throw new Error("请求被取消");
          }
          if (error.code === "ECONNABORTED") {
            throw new Error("请求超时，请刷新重试");
          }
          if (error.response?.status === 504) {
            throw new Error("服务器响应超时，请稍后重试");
          }
          if (error.response?.status === 503) {
            throw new Error("服务暂时不可用，请稍后重试");
          }

          throw new Error(
            error.response?.data?.message || "请求失败，请稍后重试"
          );
        }
      }

      throw lastError;
    },
    []
  );

  const { data: listData, error } = useSWR<MemoItem[], Error>(
    [API_GET_MEMO, searchValue, userId],
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: true,
      dedupingInterval: 5000,
      focusThrottleInterval: 5000,
      loadingTimeout: 15000,
      errorRetryCount: 3,
      errorRetryInterval: 3000,
      onSuccess: (data) => {
        setMemoData(data);
      },
    }
  );

  const isNeedOperate = useCallback((flag: string, key: number) => {
    setOperateFlag(flag === "Y");
    setCrtKey(key);
  }, []);

  const updateMemoCount = useCallback((change: number) => {
    setMemoCount((prevCount) => prevCount + change);
  }, []);

  useEffect(() => {
    if (listData) setMemoCount(listData.length);
  }, [listData, searchValue]);

  const [selectedDate] = useAtom(selectedDateAtom);

  const filteredListData = useMemo(() => {
    if (!listData) return [];

    // 使用 Set 优化搜索性能
    const searchTerms = searchValue.toLowerCase().split(" ");
    const searchSet = new Set(searchTerms);

    return listData.filter((item) => {
      // 1. 先检查日期匹配，因为这个操作开销较大
      if (selectedDate) {
        const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
        const dateMatches = format(itemDate, "yyyy-MM-dd") === selectedDate;
        if (!dateMatches) return false;
      }

      // 2. 如果没有搜索词，直接返回
      if (!searchValue) return true;

      // 3. 搜索词匹配 - 使用 Set 来优化多关键词搜索
      const itemText = item.message.toLowerCase();
      return Array.from(searchSet).every((term) => itemText.includes(term));
    });
  }, [listData, searchValue, selectedDate]);

  return (
    <>
      {error ? (
        <div style={{ textAlign: "center" }}>加载失败，请稍等或稍后再试</div>
      ) : (
        <ul className='memoCard-ul' style={{ height: listHeight }}>
          {filteredListData && filteredListData.length > 0 ? (
            filteredListData.map((item, index) => (
              <MemoItem
                key={item._id}
                item={item}
                index={index}
                operateFlag={operateFlag}
                crtKey={crtKey}
                isNeedOperate={isNeedOperate}
                toastObj={toastObj}
                updateMemoCount={updateMemoCount}
              />
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
};

export default memo(MemoList);
