import { useState, useEffect } from "react";

function useCounter() {
  const [count, setCount] = useState<number>(
    parseInt(localStorage.getItem("count") || "0")
  );

  useEffect(() => {
    localStorage.setItem("count", count.toString());
  }, [count]);

  const increment = () => {
    setCount(count + 1);
  };

  return { count, increment };
}

export default useCounter;
