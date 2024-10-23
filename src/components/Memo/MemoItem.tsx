import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  Suspense,
  lazy,
  memo,
} from "react";
import {
  API_GET_MEMO,
  API_UPDATE_MEMO,
  API_DELETE_MEMO,
} from "../../util/apiURL";
import axios from "axios";
import { useAtom } from "jotai";
import { mutate } from "swr";
import { useAuth0 } from "@auth0/auth0-react";
import { searchValueAtom } from "../../util/atoms";
import { toast } from "react-toastify";
import { modules, formats } from "../../util/quillConfig";
import Loading from "../Common/loading";
import debounce from "../../util/debounce";

const LazyReactQuill = lazy(() => import("./LazyReactQuill"));

interface MemoItemProps {
  item: {
    _id: string;
    createdAt: string;
    message: string;
  };
  index: number;
  operateFlag: boolean;
  crtKey: number | undefined;
  isNeedOperate: (flag: string, key: number) => void;
  toastObj: { transition: any; autoClose: number };
  updateMemoCount: (count: number) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({
  item,
  index,
  operateFlag,
  crtKey,
  isNeedOperate,
  toastObj,
  updateMemoCount,
}) => {
  const { _id, createdAt, message } = item;
  const canOperate = operateFlag && index === crtKey;
  const [editedMessage, setEditedMessage] = useState(message);
  const [editingId, setEditingId] = useState<string | null>(null);
  const quillRef = useRef<any>(null);
  const { user } = useAuth0();
  const [searchValue] = useAtom(searchValueAtom);

  const isEditing = editingId === _id;

  const handleEdit = useCallback(() => {
    setEditingId(_id);
    setEditedMessage(message);
  }, []);

  const handleCancel = useCallback(() => {
    setEditedMessage(message);
    setEditingId(null);
  }, []);

  const debouncedDeleteMemo = useCallback(
    debounce(async () => {
      try {
        const { data } = await axios.delete(`${API_DELETE_MEMO}/${_id}`, {
          params: { userId: user?.sub },
        });
        if (data.success) {
          toast.success("删除成功", toastObj);
          updateMemoCount(-1);
          mutate([API_GET_MEMO, searchValue, user?.sub]);
        } else {
          toast.error("删除失败", toastObj);
        }
      } catch (e) {
        toast.error(`🦄 删除失败: ${e}`, toastObj);
      }
    }, 300),
    [_id]
  );

  const debouncedHandleSave = useCallback(
    debounce(async () => {
      try {
        const { data } = await axios.patch(API_UPDATE_MEMO, {
          _id,
          message: editedMessage,
          userId: user?.sub,
        });
        if (data.success) {
          toast.success("更新成功", toastObj);
          mutate([API_GET_MEMO, searchValue, user?.sub]);
        } else {
          toast.error("更新失败", toastObj);
        }
      } catch (e) {
        toast.error(`🦄 更新失败: ${e}`, toastObj);
      }
      setEditingId(null);
    }, 300),
    [_id, editedMessage]
  );

  useEffect(() => {
    if (isEditing) setEditedMessage(message);
  }, [isEditing, message]);

  return (
    <li
      className='memoCard-li'
      onMouseEnter={() => isNeedOperate("Y", index)}
      onMouseLeave={() => isNeedOperate("n", index)}>
      <label className='memoTime-label'>{createdAt}</label>
      {canOperate && !isEditing && (
        <div className='operate-buttons'>
          <span className='operate-label edit' onClick={handleEdit}>
            ✎
          </span>
          <span className='operate-label delete' onClick={debouncedDeleteMemo}>
            ✖
          </span>
        </div>
      )}
      <div onDoubleClick={handleEdit}>
        {isEditing ? (
          <div className='memoCard-div editing'>
            <Suspense fallback={<Loading spinning={false} />}>
              <LazyReactQuill
                value={editedMessage}
                modules={modules}
                formats={formats}
                ref={quillRef}
                placeholder='请输入内容'
                onChange={setEditedMessage}
              />
            </Suspense>
            <div className='edit-buttons'>
              <button className='btn btn-save' onClick={debouncedHandleSave}>
                保存
              </button>
              <button className='btn btn-cancel' onClick={handleCancel}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div
            className='memoCard-div'
            dangerouslySetInnerHTML={{ __html: message }}
          />
        )}
      </div>
    </li>
  );
};

export default memo(MemoItem);
