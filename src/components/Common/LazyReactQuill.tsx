/**
 * LazyReactQuill 组件
 * 懒加载的富文本编辑器组件
 * @module LazyReactQuill
 */

import { useImperativeHandle, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/**
 * 组件属性定义
 * @interface LazyReactQuillProps
 */
interface LazyReactQuillProps {
  value: string;
  onChange: (content: string) => void;
  modules?: any;
  formats?: string[];
  placeholder?: string;
  ref?: React.Ref<QuillHandle>;
}

/**
 * 暴露给父组件的方法接口
 * @interface QuillHandle
 */
interface QuillHandle {
  focus: () => void;
  blur: () => void;
  getEditor: () => any;
}

const QuillComponent = ReactQuill as any;

/**
 * 富文本编辑器组件
 * @param props - 组件属性
 * @returns React 组件
 */
const LazyReactQuill = ({
  value,
  onChange,
  modules,
  formats,
  placeholder,
  ref,
}: LazyReactQuillProps) => {
  // 存储编辑器实例的引用
  const quillRef = useRef<any>(null);
  // 暴露给父组件的方法接口
  const internalRef = useRef<QuillHandle>(null);

  /**
   * 设置组件对外暴露的方法
   * 使用 useImperativeHandle 优化性能
   */
  useImperativeHandle(
    ref || internalRef,
    () => ({
      focus: () => quillRef.current?.focus(),
      blur: () => quillRef.current?.blur(),
      getEditor: () => quillRef.current?.getEditor(),
    }),
    [quillRef.current]
  );

  /**
   * 处理内容变化
   */
  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <QuillComponent
      theme='snow'
      value={value}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      ref={quillRef}
    />
  );
};

export default LazyReactQuill;
