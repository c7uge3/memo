import { useState, useEffect } from "react";

function useOnlineStatus(): boolean {
  const [onlineStatus, setOnlineStatus] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setOnlineStatus(navigator.onLine);
    };
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  return onlineStatus;
}

export default useOnlineStatus;

/**
 * 这个 Hook 将返回一个布尔值，指示用户是否处于在线状态。
 * 我们将通过使用 navigator.onLine 属性来检测用户的在线状态，并且在 online 和 offline 事件上添加监听器来及时更新在线状态。
 * 这个 Hook 可以在应用程序中用于确定是否应该禁用在线功能或通知用户当前处于离线状态。
 * 在这个实现中，我们使用 useState 定义了 onlineStatus 状态，并将初始值设置为 navigator.onLine 属性的值，即初始状态下用户的在线状态。
 * 然后，在 useEffect 中，我们定义了 handleOnlineStatusChange 函数，它将在 online 和 offline 事件上被调用，并使用 navigator.onLine 属性的值更新 onlineStatus 状态。
 * 我们将 handleOnlineStatusChange 函数添加为 online 和 offline 事件的监听器，以便在用户的在线状态发生变化时及时更新 onlineStatus 的值。
 * 接着，我们在 useEffect 的清理函数中删除这两个事件的监听器，以避免内存泄漏。
 * 最后，我们在 useOnlineStatus 函数的返回语句中返回 onlineStatus 状态值，以便其他组件可以使用这个 Hook 来获取用户的在线状态。
 */