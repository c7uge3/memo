import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import emitter from "../util/event";

// interface LocationState {
//   pathname: string;
// }

function SideBar() {
  // const location = useLocation<LocationState>();
  // const currentPath = location.pathname.substring(1);
  // const defaultFlag = currentPath === "rest" ? false : true;
  const [memo, setMemo] = useState<boolean>(true);
  const [rest, setRand] = useState<boolean>(false);
  const [memoCount, setMemoCount] = useState<number>(0);

  // 事件委托，切换路由后设置导航对应状态
  const navClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const routeName = (e.target as HTMLAnchorElement).className;
    if (routeName === "memo") {
      setMemo(true);
      setRand(false);
    } else {
      setMemo(false);
      setRand(true);
    }
  };

  // memo 数量统计
  useEffect(() => {
    emitter.addListener("memoCount", (memoCount) => {
      setMemoCount(memoCount);
    });
  }, []);

  return (
    <aside className='side-div'>
      <div className='sideHeader-div'>
        <span className='nickname-span'>
          <label className='name-label'>c7uge3</label>
          <label className='pro-label'>PRO</label>
        </span>
      </div>
      <div className='sideStat-div'>
        <div className='sideStat-div'>{memoCount} MEMOS</div>
        <div className='gridView-div'></div>
      </div>
      <ul className='sideMenu-ul' onClick={navClick}>
        <li className={memo ? "selected-li" : ""}>
          <Link to='/memo' className='memo'>
            📒 MEMO
          </Link>
        </li>
        <li className={rest ? "selected-li" : ""}>
          <Link to='/rest' className='rest'>
            🧘🏻 禅模式
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default React.memo(SideBar);
