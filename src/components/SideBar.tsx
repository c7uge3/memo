import React, {
  useState,
  useEffect,
  memo,
  Suspense,
  useDeferredValue,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { memoCountAtom } from "./Memo/atoms";
import Heatmap, { ActivityData } from "./Heatmap";
import useSWR from "swr";
import axios from "axios";
import { API_GET_MEMO } from "../util/apiURL";
import moment from "moment";
import useDeviceType from "./Hook/useDeviceType";
import ErrorBoundary from "./Memo/ErrorBoundary";
import Loading from "./Common/loading";

interface SideBarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideBar: React.FC<SideBarProps> = () => {
  const [memoCount] = useAtom(memoCountAtom);
  const [isMemo, setIsMemo] = useState(true);
  const { pathname } = useLocation();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const deviceType = useDeviceType();
  const deferredActivityData = useDeferredValue(activityData);

  // 获取memo数据
  const fetcher = async ([url, message]: [string, string]): Promise<any[]> => {
    const { data } = await axios.get(url, { params: { message } });
    return data.data;
  };
  const { data: listData } = useSWR<any[], Error>([API_GET_MEMO, ""], fetcher, {
    revalidateOnFocus: false,
    suspense: true,
    dedupingInterval: 1000,
    focusThrottleInterval: 1000,
    revalidateOnMount: false,
  });

  useEffect(() => {
    setIsMemo(pathname === "/memo" || pathname === "/"); // 设置 isMemo 状态，判断请求的是否是 memo 页路由
  }, [pathname]);

  useEffect(() => {
    if (listData) {
      const activityMap = new Map<string, number>(); // 用于存储每天的memo数量

      // 初始化最近3个月的每一天
      const endDate = moment().endOf("day");
      const startDate = moment().subtract(3, "months").startOf("day");
      while (startDate.isSameOrBefore(endDate)) {
        activityMap.set(startDate.format("YYYY-MM-DD"), 0);
        startDate.add(1, "day");
      }

      // 统计每天的memo数量，只考虑近3个月的数据
      listData.forEach((item) => {
        const itemDate = moment(item.createdAt);
        if (itemDate.isAfter(moment().subtract(3, "months"))) {
          const date = itemDate.format("YYYY-MM-DD");
          if (activityMap.has(date)) {
            activityMap.set(date, (activityMap.get(date) || 0) + 1);
          }
        }
      });

      // 转换为ActivityData数组,
      const newActivityData: ActivityData[] = Array.from(
        activityMap,
        ([date, count]) => ({ date, count })
      );
      setActivityData(newActivityData); // 更新热力图的活动数据
    }
  }, [listData]);

  useEffect(() => {
    setIsCollapsed(deviceType === "mobile");
  }, [deviceType]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`side-div ${isCollapsed ? "collapsed" : ""}`}>
      <div
        className='toggle-btn'
        onClick={toggleSidebar}
        title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}>
        <svg width='10' height='10' viewBox='0 0 10 10'>
          <path
            d='M3,2 L7,5 L3,8'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
      </div>
      <div className='sideHeader-div'>
        <span className='nickname-span'>
          <label className='name-label'>Chio</label>
          <label className='pro-label'>PRO</label>
        </span>
      </div>
      {!isCollapsed && (
        <>
          <div className='sideStat-div'>
            <div className='memoCount-div'>
              {memoCount} {memoCount > 1 ? "Memos" : "Memo"}
            </div>
            <div className='gridView-div'>
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className='fade-in'>
                      <Loading spinning={true} />
                    </div>
                  }>
                  <Heatmap data={deferredActivityData} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
          <ul className='sideMenu-ul'>
            <li className={isMemo ? "selected-li" : ""}>
              <Link to='/memo' className='memo'>
                📒 MEMO
              </Link>
            </li>
            <li className={!isMemo ? "selected-li" : ""}>
              <Link to='/rest' className='rest'>
                🧘🏻 敲木鱼
              </Link>
            </li>
          </ul>
        </>
      )}
    </aside>
  );
};

export default memo(SideBar);
