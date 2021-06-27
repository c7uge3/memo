import React from "react";
import { Link } from "react-router-dom";
import emitter from "../util/event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { faMapSigns } from "@fortawesome/free-solid-svg-icons";

class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { memoCount: 0, isMemo: true };
  }

  componentDidMount() {
    // memo 数量统计
    this.countEmitter = emitter.addListener("memoCount", (memoCount) => {
      this.setState({ memoCount });
    });
  }

  menuClick = (flag) => {
    const memo = flag === "memo" ? true : false;
    this.setState({
      isMemo: memo,
      isRand: !memo,
    });
  };

  render() {
    const { memoCount, isMemo, isRand } = this.state;

    return (
      <aside className='side-div'>
        <div className='sideHeader-div'>
          <span className='nickname-span'>
            <label className='name-label'>c7uge3</label>
            <label className='pro-label'>PRO</label>
          </span>
        </div>
        <div className='sideStat-div'>
          <div className='statView-div'>
            <div>
              <label className='statView-label label-count'>{memoCount}</label>
              <label className='statView-label label-type'>MEMO</label>
            </div>
            <div>
              <label className='statView-label label-count'>{memoCount}</label>
              <label className='statView-label label-type'>MEMO</label>
            </div>
            <div>
              <label className='statView-label label-count'>{memoCount}</label>
              <label className='statView-label label-type'>MEMO</label>
            </div>
          </div>
          {/* <div className="gridView-div"></div> */}
        </div>
        <ul className='sideMenu-ul'>
          <Link to='/'>
            <li
              className={isMemo ? "selected-li" : ""}
              onClick={() => this.menuClick("memo")}>
              <FontAwesomeIcon icon={faClipboardList} />
              &nbsp;MEMO
            </li>
          </Link>
          <Link to='/rand'>
            <li
              className={isRand ? "selected-li" : ""}
              onClick={() => this.menuClick("rand")}>
              <FontAwesomeIcon icon={faMapSigns} />
              随机漫步
            </li>
          </Link>
        </ul>
      </aside>
    );
  }
}

export default SideBar;
