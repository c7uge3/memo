import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

function useCounter() {
  const { user } = useAuth0();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (user?.sub) {
      const storedCount = localStorage.getItem(`count_${user.sub}`);
      setCount(storedCount ? parseInt(storedCount, 10) : 0);
    }
  }, [user]);

  const increment = () => {
    if (user?.sub) {
      const newCount = count + 1;
      setCount(newCount);
      localStorage.setItem(`count_${user.sub}`, newCount.toString());
    }
  };

  return { count, increment };
}

export default useCounter;
