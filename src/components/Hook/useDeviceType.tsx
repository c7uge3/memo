import { useState, useEffect } from "react";

type DeviceType = "mobile" | "tablet" | "desktop";

function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth } = window;
      if (innerWidth < 768) {
        setDeviceType("mobile");
      } else if (innerWidth < 992) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

export default useDeviceType;

/**
 * 这个 Hook 将根据当前设备的屏幕宽度返回一个设备类型的字符串，可能的设备类型为 "mobile"、"tablet"、"desktop"。
 * 我们将基于一些常见的设备屏幕宽度来确定这些设备类型的阈值，但也可以根据具体需求自定义这些阈值。
 * 在这个实现中，我们首先定义了 DeviceType 类型，它是一个字符串类型，只允许 "mobile"、"tablet"、"desktop" 这三个值中的一种。
 * 接下来，在 useDeviceType 函数中，我们使用 useState 定义了 deviceType 状态，并将初始值设置为 "desktop"。
 * 然后，在 useEffect 中，我们使用 handleResize 函数来根据当前屏幕宽度设置 deviceType 的值。
 * 当屏幕宽度小于 768 像素时，设备类型为 "mobile"；当屏幕宽度小于 992 像素时，设备类型为 "tablet"；否则设备类型为 "desktop"。
 * 我们将 handleResize 函数添加为 resize 事件的监听器，以便在屏幕大小变化时自动更新 deviceType 的值。
 * 接着，我们在 useEffect 的清理函数中删除 resize 事件监听器，以避免内存泄漏。
 * 最后，我们在 useDeviceType 函数的返回语句中返回 deviceType 状态值，以便其他组件可以使用这个 Hook 来获取当前设备类型。
 */
