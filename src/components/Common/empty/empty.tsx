// 源文件
import React from "react";
import PropTypes from "prop-types";
import type { EmptyProps } from "./interface";

const prefixCls = "sense-empty";

// DOM 组装
const Empty: React.FC<EmptyProps> = ({ description, imageSrc }) => (
  <div className={prefixCls}>
    <img src={imageSrc} />
    <label>{description}</label>
  </div>
);

// 默认 Prop 值
Empty.defaultProps = {
  description: "暂无数据",
  imageSrc: "https://i.loli.net/2021/04/19/u4ElMt7mWaUpihB.png",
};

export default Empty;
