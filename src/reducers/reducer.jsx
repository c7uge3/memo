import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

// 创建一个 slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: state => {
      state.count += 1;
    },
    decrement: state => {
      state.count -= 1;
    },
  },
});

// 创建 store
const store = configureStore({
  reducer: counterSlice.reducer,
});

// 定义一个 Counter 组件
function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        +1
      </button>
      <button onClick={() => dispatch(counterSlice.actions.decrement())}>
        -1
      </button>
    </div>
  );
}

// 将 Counter 组件渲染到页面中
function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// 渲染 App 组件到页面中
ReactDOM.render(<App />, document.getElementById('root'));
