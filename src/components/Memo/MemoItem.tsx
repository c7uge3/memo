import {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
  useOptimistic,
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
import { toast, Zoom, type ToastTransitionProps } from "react-toastify";
import { modules, formats } from "../../util/quillConfig";
import Loading from "../Common/loading";

const LazyReactQuill = lazy(() => import("../Common/LazyReactQuill"));

const TOAST_CONFIG = { transition: Zoom, autoClose: 1000 };

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
  updateMemoCount: (count: number) => void;
  toastObj?: {
    transition: ({
      children,
      position,
      preventExitTransition,
      done,
      nodeRef,
      isIn,
      playToast,
    }: ToastTransitionProps) => React.JSX.Element;
    autoClose: number;
  };
}

const MemoItem: React.FC<MemoItemProps> = ({
  item,
  index,
  operateFlag,
  crtKey,
  isNeedOperate,
  updateMemoCount,
}) => {
  const { _id, createdAt, message } = item;
  const canOperate = operateFlag && index === crtKey;
  const [editedMessage, setEditedMessage] = useState(message);
  const [optimisticMessage, addOptimisticMessage] = useOptimistic(
    message,
    (_state, newMessage: string) => newMessage
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const quillRef = useRef<any>(null);
  const { user } = useAuth0();
  const [searchValue] = useAtom(searchValueAtom);

  const isEditing = editingId === _id;

  const handleEdit = () => {
    setEditingId(_id);
    setEditedMessage(message);
    addOptimisticMessage(message);
  };

  const handleCancel = () => {
    setEditedMessage(message);
    addOptimisticMessage(message);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!user?.sub) return;

    // 乐观更新列表 UI
    const key = [API_GET_MEMO, searchValue, user.sub];
    const prevData = await mutate(
      key,
      (currentData: any) => {
        if (!currentData) return currentData;
        return currentData.filter((item: any) => item._id !== _id);
      },
      false
    );

    try {
      const { data } = await axios.delete(`${API_DELETE_MEMO}/${_id}`, {
        params: { userId: user.sub },
      });

      if (data.success) {
        toast.success("删除成功", TOAST_CONFIG);
        updateMemoCount(-1);
        // 删除后重新获取数据
        await mutate(key);
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      toast.error("删除失败，请重试", TOAST_CONFIG);
      await mutate(key, prevData, false);
    }
  };

  const handleSave = async () => {
    if (!user?.sub) return;

    try {
      addOptimisticMessage(editedMessage);

      const { data } = await axios.patch(API_UPDATE_MEMO, {
        _id,
        message: editedMessage,
        userId: user.sub,
      });

      if (data.success) {
        toast.success("更新成功", TOAST_CONFIG);
        await mutate([API_GET_MEMO, searchValue, user.sub]);
        setEditingId(null);
      } else {
        throw new Error("更新失败");
      }
    } catch (error) {
      addOptimisticMessage(message);
      toast.error(
        error instanceof Error ? error.message : "更新失败",
        TOAST_CONFIG
      );
    }
  };

  const handleEditorChange = (content: string) => {
    setEditedMessage(content);
    addOptimisticMessage(content);
  };

  useEffect(() => {
    if (isEditing && quillRef.current) {
      quillRef.current.focus();
    }
  }, [isEditing]);

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
          <span className='operate-label delete' onClick={handleDelete}>
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
                onChange={handleEditorChange}
              />
            </Suspense>
            <div className='edit-buttons'>
              <button
                className='btn btn-save'
                onClick={handleSave}
                disabled={false}>
                保存
              </button>
              <button
                className='btn btn-cancel'
                onClick={handleCancel}
                disabled={false}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div
            className='memoCard-div'
            dangerouslySetInnerHTML={{ __html: optimisticMessage }}
          />
        )}
      </div>
    </li>
  );
};

export default MemoItem;
