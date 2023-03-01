import React, { useState, useEffect, useCallback, useRef } from "react";
import emitter from "../../util/event";
import ReactQuill from "react-quill";
import axios from "axios";
import "react-quill/dist/quill.snow.css";
import { toast, ToastTransitionProps } from "react-toastify";

type Flip = ({
  children,
  position,
  preventExitTransition,
  done,
  nodeRef,
  isIn,
}: ToastTransitionProps) => JSX.Element;

function Editor(props: {
  editorHeight: (editorHeight: number) => void;
  flip: Flip;
}) {
  // const quillRef = useRef<{ focus: () => void }>({ focus: () => {} });
  // const quillRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const fixedRef = useRef<{ clientHeight: number }>({ clientHeight: 0 });
  const searchRef = useRef<{ value: string }>({ value: "" });

  const [message, setMessage] = useState<string>("");
  const [sendBtnClass, setSendBtnClass] = useState<string>("send-btn");
  const [initData, setInitData] = useState<Array<string>>([]);
  const [showClearIco, setShowClearIco] = useState<boolean>(false); // 搜索框的清除按钮状态

  useEffect(() => {
    emitter.addListener("feedBack", () => setInitData(initData));
    emitter.removeListener("feedBack", () => {});
    quillRef.current?.focus(); // 编辑器聚焦
  }, []);

  // 编辑器默认值
  const defaultMessage = "<p><br></p>"; // quill 的默认值

  // 响应文本输入变更
  const handleTxtChange = (message: string) => {
    const fixedHeight: number = fixedRef.current.clientHeight;
    const msgRole: boolean | "" = message && message !== defaultMessage;
    setMessage(message); // 对 quill 做了双向数据绑定
    setSendBtnClass(msgRole ? "send-btn send-btn-enable" : "send-btn"); // 对 quill 做了双向数据绑定
    props.editorHeight(fixedHeight); // 调用父组件的方法，并传递参数
  };

  // 发送 message
  const sendMessage = (message: string) => {
    if (message && message !== defaultMessage) {
      // let currentIds = initData.map((item) => item.id);
      // let idToBeAdded = currentIds.length ? Math.max(...currentIds) + 1 : 0;
      putMemo(message);
      setMessage(""); // 发送后重置文本输入框内容
    }
  };

  /**
   * 新增 memo
   * @param {*} message
   */
  const putMemo = useCallback((message: string) => {
    axios
      .post("http://localhost:3001/api/putMemo", { message })
      .then((res) => {
        const { success } = res.data;
        const { flip } = props;

        if (success) {
          emitter.emit("sendMessage", message);
          toast.success("🚀 发送成功", {
            transition: flip,
            autoClose: 1500,
          });
        } else {
          toast.error("🦄 发送失败", {
            transition: flip,
            autoClose: 1500,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // 搜索框输入变更或执行搜索
  const searchTxtChange = (
    e: { target: { value: string }; keyCode: number } | null
  ) => {
    if (e) {
      const { value } = e.target;
      if (e.keyCode === 13) {
        emitter.emit("searchMemo", value);
      } else {
        setShowClearIco(!!value);
      }
    } else {
      emitter.emit("searchMemo", null);
    }
  };

  // 清空搜索框内容并检索出全部 memo
  const clearSearchTxt = () => {
    searchRef.current.value = "";
    searchTxtChange(null);
    setShowClearIco(false); // clear 按钮在点击后也应移除
  };

  // 配置 quill modules
  const modules = {
    toolbar: [
      [
        { list: "bullet" },
        { list: "ordered" },
        "bold",
        "underline",
        "image",
        "clean",
      ],
    ],
  };

  // 配置 quill formats
  const formats: Array<string> = [
    "bullet",
    "list",
    "bold",
    "underline",
    "image",
    "clean",
  ];

  return (
    <div
      className='fixed-div'
      ref={fixedRef as React.RefObject<HTMLDivElement>}>
      <figure>
        <div className='topbar-div'>
          <span className='title-span'>MEMO</span>
          <span className='ipt-span'>
            <input
              type='text'
              placeholder='搜索一下...'
              className='ipt-input'
              ref={searchRef as React.RefObject<HTMLInputElement>}
              onKeyUp={searchTxtChange as any}
            />
            <label className='fa-search'>🔍</label>
            {showClearIco ? (
              <label className='fa-clear' onClick={clearSearchTxt}>
                ✖
              </label>
            ) : null}
          </span>
        </div>
        {/*//@ts-ignore*/}
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

export default Editor;
