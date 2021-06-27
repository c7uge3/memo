// 源文件，本应是包裹式、有动效的，待调整
import React from "react";
import PropTypes from "prop-types";
import type { LoadingProps } from "./interface";

const prefixCls = "sense-loading";
const senseIcon = <label>假装是动效</label>;

// DOM 组装
const Loading: React.FC<LoadingProps> = ({ indicator, spinning, tip }) => (
  <div>
    {spinning ? (
      <div className={prefixCls}>
        {indicator}
        <label>{tip}</label>
      </div>
    ) : null}
  </div>
);

// 默认 Prop 值
Loading.defaultProps = {
  indicator: senseIcon,
  spinning: false,
  tip: "装载中...",
};

export default Loading;
