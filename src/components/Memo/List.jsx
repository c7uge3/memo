import React, { Component } from "react";
import emitter from "../../util/event";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackspace } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import Empty from "./../../components/Common/empty";
import Loading from "./../../components/Common/loading";
import "./../../components/Common/empty/style/index.less";
import "./../../components/Common/loading/style/index.less";

class List extends Component {
  _isMounted = false; // 标记，用于判断是否需要调用 getMessage 方法

  constructor(props) {
    super(props);

    this.state = {
      showOperate: false, // 删除按钮状态
      crtKey: null, // 当前交互项的 key，主要用于删除功能
      data: [], // 用于列表渲染
      spinning: false, // 加载动效
    };
    this.getMessage();
    toast.success("🚀 Memo 装载成功", {
      transition: this.props.flip,
      autoClose: 1500,
    });
  }

  componentDidMount() {
    this._isMounted = true; // 在组件卸载时会被置为 false，以防止重复注册 getMessage 方法

    // 接收到新的发送信号后，重新获取 message
    emitter.addListener("sendMessage", () => {
      if (this._isMounted) {
        this.getMessage();
      }
    });

    // 接收搜索信号...
    emitter.addListener("searchMemo", (message) => {
      if (this._isMounted) {
        this.getMessage(message);
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
    emitter.removeListener("sendMessage", () => {}); // listener 的参数类型必须为 Function
    emitter.removeListener("searchMemo", () => {});
  }

  //获取 message
  getMessage = (message) => {
    this.setState({ spinning: true });
    const params = { params: { message } }; // get 方法传 prams 的方式与 post 方法有所不同
    axios.get("http://localhost:3001/api/getData", params).then((res) => {
      const { data } = res.data;

      if (data) {
        const memoCount = data.length; // 已发送的 memo 数量
        const { flip } = this.props;
        emitter.emit("feedBack", data); // 回送给 Memo 父组件
        emitter.emit("memoCount", memoCount); // 提供给 SideBar 组件
        this.setState({ data, spinning: false });
      } else {
        toast.error("🦄 获取 Memo 失败", {
          transition: flip,
          autoClose: 1500,
        });
        this.setState({ spinning: false });
      }
    });
  };

  // 控制是否提供删除按钮
  isNeedOperate = (flag, crtKey) => {
    const showOperate = flag === "Y" ? true : false;
    this.setState({ showOperate, crtKey });
  };

  // 删除 message
  memoDelete = (id) => {
    axios
      .delete("http://localhost:3001/api/deleteData", {
        data: { id },
      })
      .then((res) => {
        const { success } = res.data;
        const { flip } = this.props;

        if (success) {
          toast.success("🚀 删除成功", {
            transition: flip,
            limit: 1,
            autoClose: 1500,
          });
          this.getMessage();
        } else {
          toast.error("🦄 删除失败", {
            transition: flip,
            autoClose: 1500,
          });
        }
      });
  };

  render() {
    /**
     * 不依赖 state 和 props 之外的变量
     */
    const { data, showOperate, crtKey, spinning } = this.state;
    const { height } = this.props;

    return (
      <ul className='memoCard-ul' style={{ height }}>
        <Loading spinning={spinning}></Loading>
        {data.length ? (
          data.map((item, key) => {
            const _id = item._id, // 此处使用 _id 字段以方便删除功能的实现
              createdAt = item.createdAt, // memo 创建时间，同 _id 一样，是 mongoDB collection 的默认字段
              message = { __html: item.message }, // for dangerouslySetInnerHTML
              canOperate = showOperate && key === crtKey;

            return (
              <li
                className='memoCard-li'
                key={key}
                onMouseEnter={() => this.isNeedOperate("Y", key)}
                onMouseLeave={() => this.isNeedOperate("n", key)}>
                <label className='memoTime-label'>{createdAt}</label>
                {canOperate ? (
                  <label className='operate-label'>
                    <FontAwesomeIcon
                      icon={faBackspace}
                      title='删除'
                      onClick={() => this.memoDelete(_id)}
                    />
                  </label>
                ) : null}
                <div
                  className='memoCard-div'
                  dangerouslySetInnerHTML={message}></div>
              </li>
            );
          })
        ) : (
          <Empty />
        )}
      </ul>
    );
  }
}

export default List;
