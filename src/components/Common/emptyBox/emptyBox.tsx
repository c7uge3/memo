import React from "react";
import type { EmptyProps } from "./interface";

const prefixCls = "sense-empty";

const EmptyBox: React.FC<EmptyProps> = ({
  isShow = false,
  description = "暂无数据",
  imageSrc = "https://dub.sh/72I61jT",
}) => (
  <>
    {isShow ? (
      <div className={prefixCls}>
        <img src={imageSrc} alt='Empty' width={64} height={64} />
        <label>{description}</label>
      </div>
    ) : null}
  </>
);

export default EmptyBox;
