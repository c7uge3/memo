import useCounter from "../Hook/useCounter";

/**
 * Rest 组件，用于显示休息页面
 * @returns Rest 页面
 */
function Rest() {
  const { count, increment } = useCounter();

  return (
    <main className='content-div has-padding'>
      🧘🏻
      <div>
        <p>
          功德 + <label className='count-label'>{count}</label>
        </p>
        <button className='increment-btn' onClick={increment}>
          敲 击
        </button>
      </div>
    </main>
  );
}

export default Rest;
