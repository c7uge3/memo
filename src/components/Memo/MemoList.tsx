import { useState, useEffect, useTransition, Suspense } from "react";
import { useAtom } from "jotai";
import { Zoom } from "react-toastify";
import useSWR, { type Fetcher } from "swr";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import Loading from "../Common/loading";
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
  const [isPending, startTransition] = useTransition();
  const [, setMemoData] = useAtom(memoDataAtom);
  const [selectedDate] = useAtom(selectedDateAtom);

  const { user } = useAuth0();
  const userId = user?.sub;

  const toastObj = {
    transition: Zoom,
    autoClose: 1000,
  };

  const fetcher: Fetcher<MemoItem[], [string, string, string]> = async ([
    url,
    message,
    userId,
  ]) => {
    const maxRetries = 5;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          params: { message, userId },
          timeout: attempt === 0 ? 30000 : 45000,
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

        if (error.response?.status === 504) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`504 error, waiting ${retryDelay}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        if (attempt < maxRetries - 1) {
          const baseDelay = 1000 * (attempt + 1);
          const jitter = Math.random() * 1000;
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay + jitter)
          );
          continue;
        }

        if (axios.isCancel(error)) {
          throw new Error("请求被取消");
        }
        if (error.code === "ECONNABORTED") {
          throw new Error("请求超时，请刷新重试");
        }
        if (error.response?.status === 504) {
          throw new Error("服务器响应超时，正在重试...");
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
  };

  const { data: listData, error } = useSWR<MemoItem[], Error>(
    userId ? [API_GET_MEMO, searchValue, userId] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: true,
      dedupingInterval: 5000,
      focusThrottleInterval: 5000,
      loadingTimeout: 45000,
      errorRetryCount: 5,
      errorRetryInterval: 3000,
      onError: (error) => {
        if (error.message.includes("504")) {
          console.log("504 error detected, SWR will retry automatically");
        }
      },
      onSuccess: (data) => {
        if (Array.isArray(data)) {
          startTransition(() => {
            setMemoData(data);
            setMemoCount(data.length);
          });
        }
      },
    }
  );

  const isNeedOperate = (flag: string, key: number) => {
    startTransition(() => {
      setOperateFlag(flag === "Y");
      setCrtKey(key);
    });
  };

  const updateMemoCount = (change: number) => {
    startTransition(() => {
      setMemoCount((prevCount) => prevCount + change);
    });
  };

  useEffect(() => {
    if (listData) {
      startTransition(() => {
        setMemoCount(listData.length);
      });
    }
  }, [listData, searchValue]);

  const getFilteredListData = () => {
    if (!listData) return [];

    return listData.filter((item) => {
      if (selectedDate) {
        const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
        const dateMatches = format(itemDate, "yyyy-MM-dd") === selectedDate;
        if (!dateMatches) return false;
      }

      if (!searchValue) return true; // 如果搜索值为空，返回所有数据

      const itemText = item.message.toLowerCase();
      const searchTerms = searchValue.toLowerCase().split(" ");
      const searchSet = new Set(searchTerms);
      return Array.from(searchSet).every((term) => itemText.includes(term));
    });
  };

  const filteredListData = getFilteredListData();

  return (
    <div className='memo-list' style={{ height: listHeight }}>
      <Suspense fallback={<Loading spinning={isPending} />}>
        {error ? (
          <div className='error-message'>加载失败，请稍等或稍后再试</div>
        ) : (
          <ul className='memoCard-ul'>
            {filteredListData.length > 0 ? (
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
      </Suspense>
    </div>
  );
};

export default MemoList;
