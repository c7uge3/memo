import React from "react";
import type { EmptyProps } from "./interface";

const prefixCls = "sense-empty";

// DOM 组装
const EmptyBox: React.FC<EmptyProps> = ({ isShow, description, imageSrc }) => (
  <>
    {isShow ? (
      <div className={prefixCls}>
        <img src={imageSrc} />
        <label>{description}</label>
      </div>
    ) : (
      ""
    )}
  </>
);

// 默认 Prop 值
EmptyBox.defaultProps = {
  isShow: false,
  description: "暂无数据",
  imageSrc: "https://i.loli.net/2021/04/19/u4ElMt7mWaUpihB.png",
};

export default EmptyBox;
