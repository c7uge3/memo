/**
 * MemoItem 模块
 * 提供单条备忘录的展示和操作功能
 * @module MemoItem
 */

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
  useOptimistic,
  useActionState,
  useTransition,
  type FC,
  type ButtonHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";
import {
  API_GET_MEMO,
  API_UPDATE_MEMO,
  API_DELETE_MEMO,
} from "../../util/apiURL";
import axios from "axios";
import { mutate } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "react-toastify";
import { TOAST_CONFIG } from "../../util/toastConfig";
import { modules, formats } from "../../util/quillConfig";
import Loading from "../Common/loading";

/**
 * 懒加载富文本编辑器组件
 */
const LazyReactQuill = lazy(() => import("../Common/LazyReactQuill"));

/**
 * 组件属性接口定义
 */
interface MemoItemProps {
  item: MemoItem;
  index: number;
  operateFlag: boolean;
  crtKey: number | undefined;
  isNeedOperate: (flag: string, key: number) => void;
  updateMemoCount: (count: number) => void;
}

/**
 * 备忘录数据接口
 */
interface MemoItem {
  _id: string;
  createdAt: string;
  message: string;
}

/**
 * 操作状态类型定义
 */
type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * 缓存数据类型定义
 */
type CacheData = {
  data: MemoItem[];
  fullData?: MemoItem[];
  totalCount: number;
};

/**
 * 提交按钮组件
 * @param props - 按钮属性
 * @returns React 组件
 */
const SubmitButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  ...props
}) => {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={pending || props.disabled}>
      {pending ? "提交中..." : children}
    </button>
  );
};

/**
 * Memo 条目组件
 * 支持查看、编辑和删除功能
 * @param props - 组件属性
 * @returns React 组件
 */
const MemoItem: FC<MemoItemProps> = ({
  item,
  index,
  operateFlag,
  crtKey,
  isNeedOperate,
  updateMemoCount,
}) => {
  const { _id, createdAt, message } = item;
  const { user } = useAuth0();
  const userId = user?.sub as string;
  const quillRef = useRef<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState(message);
  const [optimisticMessage, addOptimisticMessage] = useOptimistic(
    message,
    (_state, newMessage: string) => newMessage
  );
  const [isPending, startTransition] = useTransition();

  const isEditing = editingId === _id;
  const canOperate = operateFlag && index === crtKey;

  /** 创建缓存键 */
  const createCacheKey = (userId: string, index: number) => {
    const baseKey = `${API_GET_MEMO}?userId=${userId}&page=${
      index + 1
    }&pageSize=10`;
    return index === 0 ? `${baseKey}&full=true` : baseKey;
  };

  /** 创建序列化的缓存键 */
  const createSerializedKey = (userId: string) => {
    return unstable_serialize((index) => createCacheKey(userId, index));
  };

  /** 重新验证数据 */
  const revalidateData = (userId: string) => {
    return mutate(createSerializedKey(userId));
  };

  /** 更新缓存数据 */
  const updateCache = async (
    userId: string,
    updater: (data: CacheData[]) => CacheData[]
  ) => {
    return mutate(
      createSerializedKey(userId),
      (currentData: CacheData[] | undefined) => {
        if (!currentData?.[0]?.data) return currentData || [];
        return updater(currentData);
      },
      { revalidate: false }
    );
  };

  /** 编辑器操作处理函数 */
  const handleEdit = () => {
    startTransition(() => {
      setEditingId(_id);
      setEditedMessage(message);
      addOptimisticMessage(message);
    });
  };

  /** 取消编辑 */
  const handleCancel = () => {
    startTransition(() => {
      setEditedMessage(message);
      addOptimisticMessage(message);
      setEditingId(null);
    });
  };

  /** 处理编辑器内容变化 */
  const handleEditorChange = (content: string) => {
    setEditedMessage(content);
    startTransition(() => {
      addOptimisticMessage(content);
    });
  };

  /** 保存操作的 Action State */
  const [, saveAction] = useActionState<ActionState, FormData>(
    async (_state, formData) => {
      const newMessage = formData.get("message") as string;
      const originalMessage = message;
      let previousData: any = null;

      /** 立即更新 UI */
      addOptimisticMessage(newMessage);

      /** 乐观更新缓存中的数据 */
      await updateCache(userId, (currentData) => {
        previousData = currentData;
        const firstPage = currentData[0];
        const updatedData = firstPage.data.map((memo) =>
          memo._id === _id ? { ...memo, message: newMessage } : memo
        );

        return [
          {
            ...firstPage,
            data: updatedData,
            fullData: firstPage.fullData
              ? firstPage.fullData.map((memo: MemoItem) =>
                  memo._id === _id ? { ...memo, message: newMessage } : memo
                )
              : undefined,
          },
          ...currentData.slice(1),
        ];
      });

      /** 发送更新请求 */
      const response = await axios.patch(API_UPDATE_MEMO, {
        _id,
        message: newMessage,
        userId,
      });

      if (!response.data.success) {
        /** 更新失败，完全回滚所有状态 */
        addOptimisticMessage(originalMessage);
        setEditedMessage(originalMessage);

        if (previousData) {
          await updateCache(userId, () => previousData);
        }

        await revalidateData(userId);
        toast.error("更新失败", TOAST_CONFIG);
        return { status: "error", message: "更新失败" };
      }

      toast.success("更新成功", TOAST_CONFIG);
      await revalidateData(userId);
      setEditingId(null);
      return { status: "success" };
    },
    { status: "idle", message: undefined }
  );

  /** 删除操作的 Action State */
  const [, deleteAction] = useActionState<ActionState>(
    async () => {
      let previousData: any = null;

      /** 乐观更新 UI */
      await updateCache(userId, (currentData: CacheData[]) => {
        if (!currentData?.[0]?.data) return currentData;
        previousData = currentData;
        const firstPage = currentData[0];

        return [
          {
            ...firstPage,
            data: firstPage.data.filter((memo) => memo._id !== _id),
            fullData: firstPage.fullData
              ? firstPage.fullData.filter((memo) => memo._id !== _id)
              : undefined,
            totalCount: firstPage.totalCount - 1,
          },
          ...currentData.slice(1),
        ];
      });

      /** 发送删除请求 */
      const { data } = await axios.delete(`${API_DELETE_MEMO}/${_id}`, {
        params: { userId },
      });

      if (!data.success) {
        /** 删除失败，回滚状态 */
        if (previousData) {
          await updateCache(userId, () => previousData);
        }
        await revalidateData(userId);
        toast.error(data.message || "删除失败", TOAST_CONFIG);
        return { status: "error", message: data.message || "删除失败" };
      }

      toast.success("删除成功", TOAST_CONFIG);
      updateMemoCount(-1);
      await revalidateData(userId);
      return { status: "success" };
    },
    { status: "idle", message: undefined }
  );

  /** 自动聚焦编辑器 */
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
          <form style={{ display: "inline" }}>
            <SubmitButton
              type='submit'
              className='operate-label delete'
              formAction={deleteAction}>
              ✖
            </SubmitButton>
          </form>
        </div>
      )}
      <div onDoubleClick={handleEdit}>
        {isEditing ? (
          <div className={`memoCard-div editing ${isPending ? "pending" : ""}`}>
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
            <form>
              <div className='edit-buttons'>
                <SubmitButton
                  type='submit'
                  className='btn btn-save'
                  formAction={async () => {
                    const formData = new FormData();
                    formData.append("message", editedMessage);
                    await saveAction(formData);
                  }}
                  disabled={isPending}>
                  保存
                </SubmitButton>
                <SubmitButton
                  type='button'
                  className='btn btn-cancel'
                  onClick={handleCancel}
                  disabled={isPending}>
                  取消
                </SubmitButton>
              </div>
            </form>
          </div>
        ) : (
          <div
            className={`memoCard-div ${isPending ? "pending" : ""}`}
            dangerouslySetInnerHTML={{ __html: optimisticMessage }}
          />
        )}
      </div>
    </li>
  );
};

export default MemoItem;
