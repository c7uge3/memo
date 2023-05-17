import React, { useState, useEffect, useRef } from "react";
import emitter from "../../util/event";
import axios from "axios";
import { toast, ToastTransitionProps } from "react-toastify";
import Empty from "../Common/emptyBox";
import Loading from "../Common/loading";
import "../Common/emptyBox/style/index.less";
import "./../../components/Common/loading/style/index.less";

type Flip = ({
  children,
  position,
  preventExitTransition,
  done,
  nodeRef,
  isIn,
}: ToastTransitionProps) => JSX.Element;

function List(props: { listHeight: number; flip: Flip }) {
  const [operateFlag, setOperateFlag] = useState<boolean>(false); // 删除按钮状态
  const [crtKey, setCrtKey] = useState<number>(); // 当前交互项的 key，主要用于删除功能
  const [listData, setListData] = useState<[{}]>([{}]); // 用于列表渲染
  const [spinState, setSpinState] = useState<boolean>(true); // 加载动效
  const [emptyState, setEmptyState] = useState<boolean>(false); // “暂无数据”状态
  const getDeleteMemoRef = useRef<(id: string) => void>(() => {}); // 用于存储 deleteMemo 方法，以供事件监听函数使用
  const domain: string = "http://[2409:8a28:e72:c8e1:c9c:2ede:76cb:7575]";
  const port: number = 3001;
  const apiUrl: string = domain + ":" + port;

  //获取 memo
  useEffect(() => {
    function getMemo(message: string | null) {
      type Param = {
        params: {
          message: string | null;
        };
      };
      const params: Param = { params: { message } };
      const { flip } = props; // get 方法传 prams 的方式与 post 方法有所不同
      axios
        .get(apiUrl + "/api/getMemo", params)
        .then((res) => {
          const { data } = res.data;
          if (data) {
            const memoCount: number = data.length; // 已发送的 memo 数量
            !memoCount ? setEmptyState(true) : null;
            emitter.emit("feedBack", data); // 回送给 Memo 父组件
            emitter.emit("memoCount", memoCount); // 提供给 SideBar 组件
            setListData(data);
          } else {
            toast.error("🦄 Memo 获取失败", {
              transition: flip,
              autoClose: 1500,
            });
          }
          setSpinState(false);
        })
        .catch((e) => {
          toast.error("🦄 " + e, {
            transition: flip,
            autoClose: 1500,
          });
        });
    }
    getMemo(null);

    // 删除 memo
    function deleteMemo(id: string) {
      console.log(id);
      const { flip } = props;
      axios
        .delete(apiUrl + "/api/deleteMemo", {
          data: { id },
        })
        .then((res) => {
          const { success } = res.data;
          if (success) {
            toast.success("🚀 删除成功", {
              transition: flip,
              autoClose: 1500,
            });
            getMemo(null);
          } else {
            toast.error("🦄 删除失败", {
              transition: flip,
              autoClose: 1500,
            });
          }
        })
        .catch((e) => {
          toast.error("🦄 " + e, {
            transition: flip,
            autoClose: 1500,
          });
        });
    }

    getDeleteMemoRef.current = deleteMemo;

    // 接收到新的发送信号后，重新获取 memo
    emitter.addListener("sendMessage", () => {
      getMemo(null);
    });

    // 接收搜索信号...
    emitter.addListener("searchMemo", (message: string) => {
      getMemo(message);
    });
  }, []);

  // 控制是否提供删除按钮
  const isNeedOperate = (flag: string, crtKey: number) => {
    const operateFlag = flag === "Y" ? true : false;
    setOperateFlag(operateFlag);
    setCrtKey(crtKey);
  };
  const { listHeight } = props;

  return (
    <>
      <Loading spinning={spinState} indicator={undefined}></Loading>
      <ul className='memoCard-ul' style={{ height: listHeight }}>
        {listData.length ? (
          listData.map((item: any, key: any) => {
            const _id = item._id, // 此处使用 _id 字段以方便删除功能的实现
              createdAt = item.createdAt, // memo 创建时间，同 _id 一样，是 mongoDB collection 的默认字段
              message = { __html: item.message }, // for dangerouslySetInnerHTML
              canOperate = operateFlag && key === crtKey;

            return (
              <li
                className='memoCard-li'
                key={key}
                onMouseEnter={() => isNeedOperate("Y", key)}
                onMouseLeave={() => isNeedOperate("n", key)}>
                <label className='memoTime-label'>{createdAt}</label>
                {canOperate ? (
                  <label
                    className='operate-label'
                    onClick={() => getDeleteMemoRef.current(_id)}>
                    ✖
                  </label>
                ) : null}
                <div
                  className='memoCard-div'
                  dangerouslySetInnerHTML={message}></div>
              </li>
            );
          })
        ) : (
          <Empty isShow={emptyState} />
        )}
      </ul>
    </>
  );
}

export default List;
