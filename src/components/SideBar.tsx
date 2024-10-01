import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { memoCountAtom } from "./Memo/atoms";
import Heatmap from "./Heatmap";
import useSWR from "swr";
import axios from "axios";
import { API_GET_MEMO } from "../util/apiURL";
import moment from "moment-timezone";
import useDeviceType from "./Hook/useDeviceType";
import ErrorBoundary from "./Memo/ErrorBoundary";
import Loading from "./Common/loading";

interface SideBarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SideBar: React.FC<SideBarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [memoCount] = useAtom(memoCountAtom);
  const { pathname } = useLocation();
  const [activityData, setActivityData] = useState([]);
  const deviceType = useDeviceType();

  const fetcher = async (url: string): Promise<any[]> => {
    const { data } = await axios.get(url);
    return data.data;
  };

  const { data: listData } = useSWR(API_GET_MEMO, fetcher, {
    revalidateOnFocus: false,
    suspense: true,
    dedupingInterval: 1000,
    focusThrottleInterval: 1000,
    revalidateOnMount: false,
  });

  useEffect(() => {
    if (listData) {
      const activityMap = new Map();
      const endDate = moment().tz("Asia/Shanghai").endOf("day");
      const startDate = moment()
        .tz("Asia/Shanghai")
        .subtract(3, "months")
        .startOf("day");

      while (startDate.isSameOrBefore(endDate)) {
        activityMap.set(startDate.format("YYYY-MM-DD"), 0);
        startDate.add(1, "day");
      }

      listData.forEach((item) => {
        const itemDate = moment(item.createdAt).tz("Asia/Shanghai");
        if (
          itemDate.isAfter(moment().tz("Asia/Shanghai").subtract(3, "months"))
        ) {
          const date = itemDate.format("YYYY-MM-DD");
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
      });

      const newActivityData = Array.from(activityMap, ([date, count]) => ({
        date,
        count,
      }));
      setActivityData(newActivityData as any);
    }
  }, [listData]);

  useEffect(() => {
    setIsCollapsed(deviceType === "mobile");
  }, [deviceType, setIsCollapsed]);

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
                  <Heatmap data={activityData} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
          <ul className='sideMenu-ul'>
            <li
              className={
                pathname === "/memo" || pathname === "/" ? "selected-li" : ""
              }>
              <Link to='/memo' className='memo'>
                📒 MEMO
              </Link>
            </li>
            <li className={pathname === "/dify" ? "selected-li" : ""}>
              <Link to='/dify' className='dify'>
                🤖 Dify
              </Link>
            </li>
            <li className={pathname === "/rest" ? "selected-li" : ""}>
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

export default SideBar;
