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
