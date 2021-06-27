import React from "react";
import emitter from "../../util/event";
import ReactQuill from "react-quill";
import axios from "axios";
import "react-quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

class Editor extends React.Component {
  _isMounted = false; // 标记，用于判断是否需要调用 putData 方法

  constructor(props) {
    super(props);

    this.quillRef = React.createRef();
    this.fixedRef = React.createRef();
    this.searchRef = React.createRef();
    this.state = {
      message: "",
      sendBtnClass: "send-btn",
      initData: [],
      showClearIco: false, // 搜索框的清除按钮状态
    };
  }

  componentDidMount() {
    this._isMounted = true; // 在组件卸载时会被置为 false，以防止重复注册 putData 方法
    this.quillFocus();
    emitter.addListener("feedBack", (initData) => this.setState({ initData }));
  }

  componentWillUnmount() {
    this._isMounted = false;
    emitter.removeListener("feedBack", () => {});

    // fix Warning: Can't perform a React state update on an unmounted component
    this.setState = (state, callback) => {};
  }

  // 编辑器默认值
  defaultMessage = () => "<p><br></p>"; // quill 的默认值为“<p><br></p>”

  // 编辑器聚焦
  quillFocus = () => {
    this.quillRef.current.focus();
  };

  // 响应文本输入变更
  handleTxtChange = (message) => {
    const fixedHeight = this.fixedRef.current.clientHeight;
    const defaultMessage = this.defaultMessage();
    const msgRole = message && message !== defaultMessage;
    let { sendBtnClass } = this.state;
    sendBtnClass = msgRole ? "send-btn send-btn-enable" : "send-btn";

    this.setState({ message, sendBtnClass }); // 对 quill 做了双向数据绑定
    this.props.editorHeight(fixedHeight); // 调用父组件的方法，并传递参数
  };

  // 发送 message
  sendMessage = (message) => {
    const defaultMessage = this.defaultMessage();
    if (message && message !== defaultMessage && this._isMounted) {
      // let currentIds = initData.map((item) => item.id);
      // let idToBeAdded = currentIds.length ? Math.max(...currentIds) + 1 : 0;
      this.putData(message);
    } else {
      this.quillFocus();
    }
  };

  /**
   * 新增 memo
   * @param {*} message
   */
  putData = (message) => {
    axios
      .post("http://localhost:3001/api/putData", { message })
      .then((res) => {
        const { success } = res.data;
        const { flip } = this.props;

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

        this.setState({ message: "" }); // 发送后重置文本输入框内容
        this.quillFocus();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // 搜索框输入变更或执行搜索
  searchTxtChange = (e) => {
    if (e) {
      const { value } = e.target;
      if (e.keyCode === 13) {
        emitter.emit("searchMemo", value);
      } else {
        let { showClearIco } = this.state;
        showClearIco = !!value;
        this.setState({ showClearIco });
      }
    } else {
      emitter.emit("searchMemo", null);
    }
  };

  // 清空搜索框内容并检索出全部 memo
  clearSearchTxt = () => {
    this.searchRef.current.value = "";
    this.searchTxtChange();
    this.setState({ showClearIco: false }); // clear 按钮在点击后也应移除
  };

  // 配置 quill modules
  modules = {
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
  formats = ["bullet", "list", "bold", "underline", "image", "clean"];

  render() {
    const { message, sendBtnClass, showClearIco } = this.state;

    return (
      <div className='fixed-div' ref={this.fixedRef}>
        <figure>
          <div className='topbar-div'>
            <span className='title-span'>MEMO</span>
            <span className='ipt-span'>
              <input
                type='text'
                placeholder='搜索一下...'
                className='ipt-input'
                ref={this.searchRef}
                onKeyUp={this.searchTxtChange}
              />
              <FontAwesomeIcon icon={faSearch} className='fa-search' />
              {showClearIco ? (
                <FontAwesomeIcon
                  icon={faTimesCircle}
                  className='fa-clear'
                  onClick={this.clearSearchTxt}
                />
              ) : null}
            </span>
          </div>

          <ReactQuill
            value={message}
            modules={this.modules}
            formats={this.formats}
            ref={this.quillRef}
            placeholder='现在的想法是...'
            onChange={this.handleTxtChange}
          />
          <input
            type='button'
            value='发送'
            className={sendBtnClass}
            onClick={() => {
              this.sendMessage(message);
            }}
          />
        </figure>
      </div>
    );
  }
}

export default Editor;
