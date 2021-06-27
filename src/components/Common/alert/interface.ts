// 类型声明文件
export type Kind = "success" | "info" | "warning" | "error";
export type KindMap = Record<Kind, string>;

export interface AlertProps {
  kind?: "success" | "info" | "warning" | "error";
}
