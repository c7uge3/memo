import {
  type FC,
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useAuth0 } from "@auth0/auth0-react";
import {
  memoCountAtom,
  memoDataAtom,
  selectedDateAtom,
} from "../../util/atoms";
import Heatmap from "./Heatmap";
import { toZonedTime } from "date-fns-tz";
import {
  subMonths,
  startOfDay,
  endOfDay,
  addDays,
  format,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
} from "date-fns";
import useDeviceType from "../Hook/useDeviceType";
import LogoutButton from "../Auth/LogoutButton";

interface SideBarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

const TIMEZONE = "Asia/Shanghai";

const SideBar: FC<SideBarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const [memoCount] = useAtom(memoCountAtom);
  const [memoData] = useAtom(memoDataAtom);
  const [, setSelectedDate] = useAtom(selectedDateAtom);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<
    Array<{ date: string; count: number }>
  >([]);
  const deviceType = useDeviceType();
  const { user, isAuthenticated } = useAuth0();

  const calculateActivityData = () => {
    if (!memoData?.length) {
      return [];
    }

    const activityMap = new Map();
    const now = new Date();
    const endDate = endOfDay(toZonedTime(now, TIMEZONE));
    let startDate = startOfDay(toZonedTime(subMonths(now, 3), TIMEZONE));

    while (isBefore(startDate, endDate) || isEqual(startDate, endDate)) {
      activityMap.set(format(startDate, "yyyy-MM-dd"), 0);
      startDate = addDays(startDate, 1);
    }

    for (const item of memoData) {
      if (item?.createdAt) {
        const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
        if (isAfter(itemDate, toZonedTime(subMonths(now, 3), TIMEZONE))) {
          const date = format(itemDate, "yyyy-MM-dd");
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
      }
    }

    return Array.from(activityMap, ([date, count]) => ({ date, count }));
  };

  useEffect(() => {
    const newActivityData = calculateActivityData();
    setActivityData(newActivityData);
  }, [memoData]);

  useEffect(() => {
    setIsCollapsed(deviceType === "mobile");
  }, [deviceType, setIsCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMemoClick = () => {
    setSelectedDate(null);
    navigate("/memo");
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
              <span className='memoCount' onClick={handleMemoClick}>
                {memoCount} {memoCount > 1 ? "Memos" : "Memo"}
              </span>
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
              <Link to='/memo' className='memo' preventScrollReset>
                📒 MEMO
              </Link>
            </li>
            <li className={pathname === "/rest" ? "selected-li" : ""}>
              <Link to='/rest' className='rest' preventScrollReset>
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
