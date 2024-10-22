// 通用函数类型
type AnyFunction = (...args: any[]) => any;

// 防抖函数，合并多次任务为一次
function debounce<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export default debounce;
