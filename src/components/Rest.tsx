import React from "react";
import "../style/style.css";
import useCounter from "./Hook/useCounter";

function Rand() {
  const { count, increment } = useCounter();
  return (
    <main className='content-div has-padding'>
      🧘🏻 打坐中 ...
      <div>
        <p>
          已经敲了 <label className='count-label'>{count}</label> 次
        </p>
        <button className='increment-btn' onClick={increment}>
          敲 木 鱼
        </button>
      </div>
    </main>
  );
}

export default React.memo(Rand);
