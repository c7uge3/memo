// 源文件
import React from "react";
import PropTypes from "prop-types";
import type { AlertProps, KindMap } from "./interface";

const prefixCls = "sense-alert";

// 为 KindMap 中的类型添加相应的颜色
const kinds: KindMap = {
  success: "#b7eb8f",
  info: "#1890ff",
  warning: "#ffe58f",
  error: "#ffccc7",
};

// DOM 组装
const Alert: React.FC<AlertProps> = ({
  content,
  kind = "info",
  ...restProps
}) => (
  <div
    className={prefixCls}
    style={{
      background: kinds[kind],
    }}
    {...restProps}>
    {content}
  </div>
);

// 类型检查
Alert.propTypes = {
  kind: PropTypes.oneOf(["success", "info", "warning", "error"]),
};

export default Alert;
