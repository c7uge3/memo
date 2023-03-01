// 源文件，本应是包裹式、有动效的，待调整
import React from "react";
import type { LoadingProps } from "./interface";

const prefixCls = "sense-loading";
const senseIcon = (
  <div className='lds-ripple'>
    <div></div>
    <div></div>
  </div>
);

// DOM 组装
const Loading: React.FC<LoadingProps> = ({ indicator, spinning, tip }) => (
  <>
    {spinning ? (
      <div className={prefixCls}>
        {indicator}
        <label>{tip}</label>
      </div>
    ) : null}
  </>
);

// 默认 Prop 值
Loading.defaultProps = {
  indicator: senseIcon,
  spinning: true,
  tip: "",
};

export default Loading;
