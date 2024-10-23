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
import moment from "moment-timezone";
import useDeviceType from "../Hook/useDeviceType";
import LogoutButton from "../Auth/LogoutButton";

interface SideBarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

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
      const endDate = moment().tz("Asia/Shanghai").endOf("day");
      const startDate = moment()
        .tz("Asia/Shanghai")
        .subtract(3, "months")
        .startOf("day");

      while (startDate.isSameOrBefore(endDate)) {
        activityMap.set(startDate.format("YYYY-MM-DD"), 0);
        startDate.add(1, "day");
      }

      memoData.forEach((item) => {
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
