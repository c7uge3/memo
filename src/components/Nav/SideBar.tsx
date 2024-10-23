import React, {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  memo,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { useAuth0 } from "@auth0/auth0-react";
import { memoCountAtom, memoDataAtom } from "../../util/atoms";
import Heatmap from "./Heatmap";
import { toZonedTime } from 'date-fns-tz';
import { subMonths, startOfDay, endOfDay, addDays, format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import useDeviceType from "../Hook/useDeviceType";
import LogoutButton from "../Auth/LogoutButton";

interface SideBarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

const TIMEZONE = 'Asia/Shanghai';

const SideBar: React.FC<SideBarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [memoCount] = useAtom(memoCountAtom);
  const [memoData] = useAtom(memoDataAtom);
  const { pathname } = useLocation();
  const [activityData, setActivityData] = useState([]);
  const deviceType = useDeviceType();
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (memoData.length > 0) {
      const activityMap = new Map();
      const now = new Date();
      const endDate = endOfDay(toZonedTime(now, TIMEZONE));
      let startDate = startOfDay(toZonedTime(subMonths(now, 3), TIMEZONE));

      while (isBefore(startDate, endDate) || isEqual(startDate, endDate)) {
        activityMap.set(format(startDate, 'yyyy-MM-dd'), 0);
        startDate = addDays(startDate, 1);
      }

      memoData.forEach((item) => {
        const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
        if (isAfter(itemDate, toZonedTime(subMonths(now, 3), TIMEZONE))) {
          const date = format(itemDate, 'yyyy-MM-dd');
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
      });

      const newActivityData = Array.from(activityMap, ([date, count]) => ({
        date,
        count,
      }));
      setActivityData(newActivityData as any);
    }
  }, [memoData]);

  useEffect(() => {
    setIsCollapsed(deviceType === "mobile"); // 移动端默认折叠
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
          <label className='name-label'>{user?.name}</label>
          <label className='pro-label'>
            {isAuthenticated && <LogoutButton />}
          </label>
        </span>
      </div>
      {!isCollapsed && (
        <>
          <div className='sideStat-div'>
            <div className='memoCount-div'>
              {memoCount} {memoCount > 1 ? "Memos" : "Memo"}
            </div>
            <div className='gridView-div'>
              <Heatmap data={activityData} />
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

export default memo(SideBar);
