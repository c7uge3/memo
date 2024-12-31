import { useState, useEffect, useTransition, Suspense, useRef } from "react";
import { useAtom } from "jotai";
import useSWRInfinite from "swr/infinite";
import { mutate } from "swr";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import Loading from "../Common/loading";
import Empty from "../Common/emptyBox";
import MemoItemComponent from "./MemoItem";
import { API_GET_MEMO } from "../../util/apiURL";
import {
  searchValueAtom,
  memoCountAtom,
  memoDataAtom,
  selectedDateAtom,
} from "../../util/atoms";

import "../Common/emptyBox/style/index.less";
import "../Common/loading/style/index.less";

/**
 * 组件接口定义
 */
interface ListProps {
  listHeight: number;
}

interface MemoItem {
  _id: string;
  message: string;
  createdAt: string;
  userId: string;
}

interface PageData {
  data: MemoItem[];
  fullData?: MemoItem[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * 常量配置
 */
const TIMEZONE = "Asia/Shanghai";
const PAGE_SIZE = 10;

/**
 * 格式化日期
 * @param dateString - ISO 格式的日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    const zonedDate = toZonedTime(date, TIMEZONE);
    return format(zonedDate, "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

/**
 * Memo 列表组件
 * 支持无限滚动、搜索过滤和日期筛选
 */
const MemoList: React.FC<ListProps> = ({ listHeight }) => {
  /** 全局状态 */
  const [searchValue] = useAtom(searchValueAtom);
  const [operateFlag, setOperateFlag] = useState<boolean>(false);
  const [crtKey, setCrtKey] = useState<number | undefined>(undefined);
  const [, setMemoCount] = useAtom(memoCountAtom);
  const [isPending, startTransition] = useTransition();
  const [, setMemoData] = useAtom(memoDataAtom);
  const [selectedDate] = useAtom(selectedDateAtom);

  /** Refs */
  const loadingRef = useRef<HTMLDivElement>(null);
  const shouldLoadMore = useRef(false);
  const initialDataLoaded = useRef(false);

  const { user } = useAuth0();
  const userId = user?.sub;

  /**
   * 构建 SWR 缓存键
   * @param pageIndex - 页码索引
   * @returns 缓存键或 null
   */
  const getKey = (pageIndex: number) => {
    if (!userId) return null;

    // 在筛选状态下，只请求第一页完整数据
    if ((selectedDate || searchValue) && pageIndex > 0) return null;

    if (pageIndex === 0) {
      const baseUrl = `${API_GET_MEMO}?userId=${userId}&page=1&pageSize=${PAGE_SIZE}&full=true`;
      const dateParam = selectedDate ? `&date=${selectedDate}` : "";
      const searchParam = searchValue
        ? `&search=${encodeURIComponent(searchValue)}`
        : "";
      return `${baseUrl}${dateParam}${searchParam}`;
    }

    return `${API_GET_MEMO}?userId=${userId}&page=${
      pageIndex + 1
    }&pageSize=${PAGE_SIZE}`;
  };

  /**
   * 数据获取函数
   * 包含重试和错误处理逻辑
   */
  const fetcher = async (url: string) => {
    const maxRetries = 5;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: attempt === 0 ? 30000 : 45000,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "请求失败");
        }

        return response.data;
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const baseDelay = 1000 * (attempt + 1);
          const jitter = Math.random() * 1000;
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay + jitter)
          );
          continue;
        }
        throw lastError;
      }
    }
    throw lastError;
  };

  /**
   * 使用 SWR 进行数据获取和缓存管理
   */
  const { data, error, size, setSize, isValidating, isLoading } =
    useSWRInfinite(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      parallel: false,
      suspense: true,
      dedupingInterval: 3000,
      focusThrottleInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 3000,
      persistSize: true,
      revalidateOnMount: true,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      onSuccess: (data) => {
        if (!Array.isArray(data) || !data[0]) return;

        // 更新数据总数
        const totalCount = data[0].totalCount || 0;
        setMemoCount(totalCount);

        // 首次加载或筛选状态时设置全量数据
        if (!initialDataLoaded.current || selectedDate || searchValue) {
          initialDataLoaded.current = true;
          const fullData = data[0].fullData || [];
          requestAnimationFrame(() => {
            setMemoData(fullData);
          });
          return;
        }

        // 更新数据
        const allMemos = data.flatMap((page) => page.data);
        const fullData = data[0].fullData || allMemos;

        startTransition(() => {
          setMemoData(fullData);
        });
      },
    });

  /**
   * 处理筛选条件变化时的数据重置
   */
  useEffect(() => {
    // 重置初始化标志
    initialDataLoaded.current = false;

    // 重置数据加载状态
    shouldLoadMore.current = false;

    // 重置为第一页
    setSize(1);

    // 如果没有筛选条件，重新获取数据
    if (!selectedDate && !searchValue) {
      startTransition(() => {
        mutate((key: string) => key.startsWith(API_GET_MEMO), undefined, {
          revalidate: true,
        });
      });
    }
  }, [selectedDate, searchValue]);

  /**
   * 获取过滤后的 memo 列表
   */
  const getFilteredListData = () => {
    if (!data || !data[0]) return [];

    // 获取 memo 数据
    let memos: MemoItem[] = [];
    if (selectedDate || searchValue) {
      // 在筛选状态下使用完整数据
      memos = data[0]?.fullData || [];
    } else {
      // 在非筛选状态下使用分页数据
      memos = data.flatMap((page: PageData) => page.data || []);
    }

    // 如果没有数据，直接返回空数组
    if (!memos.length) return [];

    const formattedMemos = memos.map((memo: MemoItem) => ({
      ...memo,
      createdAt: formatDate(memo.createdAt),
    }));

    // 过滤数据
    return formattedMemos.filter((item: MemoItem) => {
      // 日期筛选
      if (selectedDate) {
        const originalDate = parseISO(item.createdAt);
        const itemDate = toZonedTime(originalDate, TIMEZONE);
        const dateMatches = format(itemDate, "yyyy-MM-dd") === selectedDate;
        if (!dateMatches) return false;
      }

      // 搜索筛选
      if (searchValue) {
        const itemText = item.message.toLowerCase();
        const searchTerms = searchValue.toLowerCase().split(" ");
        const searchSet = new Set(searchTerms);
        return Array.from(searchSet).every((term) => itemText.includes(term));
      }

      return true;
    });
  };

  /**
   * 加载更多数据
   */
  const loadMore = () => {
    if (
      !shouldLoadMore.current &&
      data &&
      !isValidating &&
      data[data.length - 1]?.hasMore &&
      !selectedDate &&
      !searchValue
    ) {
      shouldLoadMore.current = true;
      setSize(size + 1).then(() => {
        shouldLoadMore.current = false;
      });
    }
  };

  /**
   * 监听滚动加载
   */
  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isValidating &&
          data?.[data.length - 1]?.hasMore &&
          !shouldLoadMore.current &&
          !selectedDate &&
          !searchValue
        ) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    const currentLoadingRef = loadingRef.current;
    if (currentLoadingRef) {
      currentObserver.observe(currentLoadingRef);
    }

    return () => {
      if (currentLoadingRef) {
        currentObserver.disconnect();
      }
    };
  }, [isValidating, data?.length, selectedDate, searchValue]);

  /**
   * 设置操作标志
   */
  const isNeedOperate = (flag: string, key: number) => {
    startTransition(() => {
      setOperateFlag(flag === "Y");
      setCrtKey(key);
    });
  };

  /**
   * 更新 memo 数量
   */
  const updateMemoCount = (change: number) => {
    startTransition(() => {
      setMemoCount((prevCount) => prevCount + change);
    });
  };

  /**
   * 渲染列表项
   */
  const renderListItems = () => {
    const filteredData = getFilteredListData();
    return filteredData.map((item: MemoItem, index: number) => (
      <MemoItemComponent
        key={item._id}
        item={item}
        index={index}
        operateFlag={operateFlag}
        crtKey={crtKey}
        isNeedOperate={isNeedOperate}
        updateMemoCount={updateMemoCount}
      />
    ));
  };

  const filteredListData = getFilteredListData();
  const hasMore =
    data &&
    data[data.length - 1]?.hasMore &&
    !isValidating &&
    !shouldLoadMore.current &&
    !selectedDate &&
    !searchValue;

  return (
    <div className='memo-list' style={{ height: listHeight }}>
      <Suspense fallback={<Loading spinning={isPending} />}>
        {error ? (
          <div className='error-message'>加载失败，请稍等或稍后重试</div>
        ) : (
          <>
            {isLoading && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Loading spinning={true} />
              </div>
            )}
            <ul className='memoCard-ul'>
              {filteredListData.length > 0 ? (
                <>
                  {renderListItems()}
                  {isValidating && !isLoading && (
                    <li className='memoCard-li'>
                      <div style={{ textAlign: "center", padding: "10px" }}>
                        <Loading spinning={true} />
                      </div>
                    </li>
                  )}
                </>
              ) : (
                <li className='memoCard-li'>
                  <Empty isShow={true} />
                </li>
              )}
            </ul>
            {hasMore && (
              <div
                ref={loadingRef}
                style={{ textAlign: "center", padding: "10px" }}>
                <span style={{ color: "#666", fontSize: "14px" }}>
                  向下滚动加载更多
                </span>
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
};

export default MemoList;
