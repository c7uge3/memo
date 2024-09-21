import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import Search from "./Search";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { modules, formats } from "../../util/quillConfig";
import { mutate } from "swr";
import axios from "axios";
import { API_PUT_MEMO, API_GET_MEMO } from "../../util/apiURL";
import { toast, Zoom } from "react-toastify";

/**
 * 编辑器组件，用于输入和发送 memo
 * @param props（editorHeight 是父组件传递的回调函数，用于设置编辑器的高度）
 * @returns 编辑器组件
 */
function Editor(props: { editorHeight: (editorHeight: number) => void }) {
  const quillRef = useRef<ReactQuill>(null);
  const fixedRef = useRef<{ clientHeight: number }>({ clientHeight: 0 });
  const [message, setMessage] = useState<string>("");
  const [sendBtnClass, setSendBtnClass] = useState<string>("send-btn");

  // 缓存 toast 对象，避免重复创建
  const toastObj = useMemo(
    () => ({
      transition: Zoom,
      autoClose: 1000,
    }),
    []
  );

  // 编辑器默认值
  const defaultMessage = "<p><br></p>"; // quill 的默认值

  // 响应文本输入变更，并调用父组件的方法
  const handleTxtChange = useCallback((message: string) => {
    const fixedHeight: number = fixedRef.current.clientHeight;
    const msgRole: boolean | "" = message && message !== defaultMessage;
    setMessage(message); // 对 quill 做了双向数据绑定
    setSendBtnClass(msgRole ? "send-btn send-btn-enable" : "send-btn"); // 对 quill 做了双向数据绑定
    props.editorHeight(fixedHeight); // 调用父组件的方法，并传递参数
  }, []); // 确保在组件重新渲染时，不会重复创建新的函数

  // 发送 message
  const sendMessage = useCallback((message: string) => {
    if (message && message !== defaultMessage) {
      putMemo(message);
      setMessage(""); // 发送后重置文本输入框内容
    }
  }, []);

  /**
   * 新增 memo
   * @param {*} message
   * @returns 新增 memo 后的结果
   */
  const putMemo = useCallback(async (message: string) => {
    try {
      const response = await axios.post(API_PUT_MEMO, { message });
      const { success } = response.data;

      if (success) {
        mutate([API_GET_MEMO, ""]); // 重新获取 memo 列表
        toast.success("发送成功", toastObj);
      } else {
        toast.error("发送失败", toastObj);
      }
    } catch (error) {
      toast.error("发送失败", toastObj);
    }
  }, []);

  useEffect(() => {
    quillRef.current?.focus();
  }, []); // 组件挂载后，编辑器聚焦

  return (
    <div
      className='fixed-div'
      ref={fixedRef as React.RefObject<HTMLDivElement>}>
      <figure>
        <div className='topbar-div'>
          <span className='title-span'>Memo</span>
          <Search />
        </div>
        <ReactQuill
          value={message}
          modules={modules}
          formats={formats}
          ref={quillRef}
          placeholder='现在的想法是...'
          onChange={handleTxtChange}
        />
        <input
          type='button'
          value='发送'
          className={sendBtnClass}
          disabled={sendBtnClass === "send-btn" ? true : false}
          onClick={() => {
            sendMessage(message);
          }}
        />
      </figure>
    </div>
  );
}

export default memo(Editor);
