/**
 * ErrorBoundary 模块
 * 提供错误边界组件，用于捕获和处理组件树中的错误
 * @module ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * 错误边界组件的属性接口
 */
interface Props {
  children: ReactNode;
}

/**
 * 错误边界组件的状态接口
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 用于捕获和处理组件树中的错误，提供降级 UI
 */
class ErrorBoundary extends Component<Props, State> {
  /**
   * 组件状态初始化
   */
  public state: State = {
    hasError: false,
    error: null,
  };

  /**
   * 从错误中派生状态
   * 更新 state 使下一次渲染能够显示降级后的 UI
   * @param error - 捕获到的错误对象
   * @returns 更新后的状态
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 捕获错误信息并记录日志
   * @param error - 错误对象
   * @param errorInfo - 错误信息
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  /**
   * 渲染组件
   * 如果有错误则显示降级 UI，否则渲染子组件
   * @returns React 节点
   */
  public render() {
    if (this.state.hasError) {
      return (
        <div
          className='error-boundary'
          style={{ textAlign: "center", color: "red" }}>
          <h1>出错了，请稍后再试。</h1>
          {process.env.NODE_ENV === "development" && (
            <details style={{ whiteSpace: "pre-wrap" }}>
              {this.state.error && this.state.error.toString()}
            </details>
          )}
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
