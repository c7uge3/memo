import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import { useAtom, useSetAtom } from "jotai";
import { toast, Zoom } from "react-toastify";
import useSWR, { mutate } from "swr";
import axios from "axios";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { modules, formats } from "../../util/quillConfig";

import Empty from "../Common/emptyBox";
import {
  API_GET_MEMO,
  API_DELETE_MEMO,
  API_UPDATE_MEMO,
} from "../../util/apiURL";
import { searchValueAtom, memoCountAtom } from "./atoms";

import "../Common/emptyBox/style/index.less";
import "../Common/loading/style/index.less";

// memo 数据类型
interface MemoItem {
  _id: string;
  createdAt: string;
  message: string;
}

// List 组件的 props
interface ListProps {
  listHeight: number;
}

/**
 * List 组件，用于渲染 memo 列表
 * @param props：ListProps，包含 listHeight
 * @returns memo 列表
 */
function List({ listHeight }: ListProps) {
  const [searchValue] = useAtom(searchValueAtom);
  const [operateFlag, setOperateFlag] = useState<boolean>(false);
  const [crtKey, setCrtKey] = useState<number | undefined>(undefined);
  const setMemoCount = useSetAtom(memoCountAtom);
  const [editingId, setEditingId] = useState<string | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  const toastObj = useMemo(
    () => ({
      transition: Zoom,
      autoClose: 1000,
    }),
    []
  );

  const fetcher = async ([url, message]: [string, string]): Promise<
    MemoItem[]
  > => {
    const { data } = await axios.get(url, { params: { message } });
    return data.data;
  };

  const { data: listData, error } = useSWR<MemoItem[], Error>(
    [API_GET_MEMO, searchValue],
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: true,
      dedupingInterval: 1000,
      focusThrottleInterval: 1000,
      revalidateOnMount: false,
    }
  );

  const MemoItem = React.memo(
    ({ item, index }: { item: MemoItem; index: number }) => {
      const { _id, createdAt, message } = item;
      const canOperate = operateFlag && index === crtKey;
      const [editedMessage, setEditedMessage] = useState(message);
      const isEditing = editingId === _id;

      const handleEdit = useCallback(() => {
        setEditingId(_id);
        setEditedMessage(message);
      }, [_id, message]);

      const handleSave = useCallback(async () => {
        try {
          const { data } = await axios.patch(API_UPDATE_MEMO, {
            id: _id,
            message: editedMessage,
          });
          if (data.success) {
            toast.success("更新成功", toastObj);
            mutate([API_GET_MEMO, searchValue]);
          } else {
            toast.error("更新失败", toastObj);
          }
        } catch (e) {
          toast.error(`🦄 ${e}`, toastObj);
        }
        setEditingId(null);
      }, [_id, editedMessage, toastObj, searchValue]);

      const handleCancel = useCallback(() => {
        setEditedMessage(message);
        setEditingId(null);
      }, [message]);

      useEffect(() => {
        // 只在进入编辑模式时更新 editedMessage
        if (isEditing) {
          setEditedMessage(message);
        }
      }, [isEditing, message]);

      return (
        <li
          className='memoCard-li'
          onMouseEnter={() => isNeedOperate("Y", index)}
          onMouseLeave={() => isNeedOperate("n", index)}
          onDoubleClick={handleEdit}>
          <label className='memoTime-label'>{createdAt}</label>
          {canOperate && !isEditing && (
            <>
              <label className='operate-label' onClick={() => deleteMemo(_id)}>
                ✖
              </label>
              <label className='operate-label' onClick={handleEdit}>
                ✎
              </label>
            </>
          )}
          {isEditing ? (
            <div className='memoCard-div editing'>
              <ReactQuill
                value={editedMessage}
                modules={modules}
                formats={formats}
                ref={quillRef}
                onChange={setEditedMessage}
              />
              <div className='edit-buttons'>
                <button className='btn btn-save' onClick={handleSave}>保存</button>
                <button className='btn btn-cancel' onClick={handleCancel}>取消</button>
              </div>
            </div>
          ) : (
            <div
              className='memoCard-div'
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
        </li>
      );
    }
  );

  const deleteMemo = useCallback(
    async (id: string) => {
      try {
        const { data } = await axios.delete(API_DELETE_MEMO, { data: { id } });
        if (data.success) {
          toast.success("删除成功", toastObj);
          if (listData) setMemoCount(listData.length - 1);
          mutate([API_GET_MEMO, searchValue]);
        } else {
          toast.error("删除失败", toastObj);
        }
      } catch (e) {
        toast.error(`🦄 ${e}`, toastObj);
      }
    },
    [listData, setMemoCount, searchValue, toastObj]
  );

  const isNeedOperate = useCallback((flag: string, key: number) => {
    setOperateFlag(flag === "Y");
    setCrtKey(key);
  }, []);

  useEffect(() => {
    if (listData) {
      setMemoCount(listData.length);
    }
  }, [listData, searchValue, setMemoCount]);

  return (
    <>
      {error ? (
        <div style={{ textAlign: "center" }}>加载失败，请稍等或稍后再试</div>
      ) : (
        <ul className='memoCard-ul' style={{ height: listHeight }}>
          {listData && listData.length > 0 ? (
            listData.map((item, index) => (
              <MemoItem key={item._id} item={item} index={index} />
            ))
          ) : (
            <li className='memoCard-li'>
              <Empty isShow={true} />
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export default memo(List);
