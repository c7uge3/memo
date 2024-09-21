import { ReactNode } from "react";

export interface LoadingProps {
  indicator?: ReactNode; // 加载动效
  spinning: boolean; // 	是否为「加载中」状态
  tip?: string; // 自定义描述文案
}
