/**
 * MemoEditor 模块
 * 提供富文本编辑器和自动保存功能
 * @module MemoEditor
 */

import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useTransition,
  useActionState,
  type FC,
} from "react";
import { useFormStatus } from "react-dom";
import Search from "./MemoSearch";
import { modules, formats } from "../../util/quillConfig";
import { mutate } from "swr";
import axios from "axios";
import { API_PUT_MEMO, API_GET_MEMO } from "../../util/apiURL";
import { toast } from "react-toastify";
import { TOAST_CONFIG } from "../../util/toastConfig";
import Loading from "../Common/loading";
import { unstable_serialize } from "swr/infinite";
import { useAtom } from "jotai";
import { useAuth0 } from "@auth0/auth0-react";
import {
  memoDataAtom,
  memoCountAtom,
  searchValueAtom,
  selectedDateAtom,
} from "../../util/atoms";

/**
 * 懒加载富文本编辑器组件
 */
const LazyReactQuill = lazy(() => import("../Common/LazyReactQuill"));

/**
 * 默认消息内容
 */
const DEFAULT_MESSAGE = "<p><br></p>";

/**
 * 操作状态类型定义
 */
type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

type MemoEditorProps = {
  editorHeight: (height: number) => void;
};

interface MemoItem {
  _id: string;
  message: string;
  createdAt: string;
  userId: string;
}

type CacheData = {
  data: MemoItem[];
  fullData?: MemoItem[];
  totalCount: number;
};

type CacheDataResponse = {
  [key: string]: CacheData[];
};

type OptimisticData = {
  _id: string;
  message: string;
  userId: string;
  createdAt: string;
};

/**
 * 提交按钮组件
 * 根据消息有效性控制按钮状态
 * @param props - 组件属性
 * @returns React 组件
 */
function SubmitButton({ isValidMessage }: { isValidMessage: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      className={isValidMessage ? "send-btn send-btn-enable" : "send-btn"}
      disabled={!isValidMessage || pending}>
      {pending ? "发送中..." : "发送"}
    </button>
  );
}

/**
 * Memo 编辑器组件
 * 支持富文本编辑、自动保存和乐观更新
 * @param props - 组件属性
 * @returns React 组件
 */
const MemoEditor: FC<MemoEditorProps> = ({ editorHeight }) => {
  const { user } = useAuth0();
  const userId = user?.sub as string;
  const quillRef = useRef<any>(null);
  const fixedRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  const [isPending, startTransition] = useTransition();
  const [, setMemoData] = useAtom(memoDataAtom);
  const [, setMemoCount] = useAtom(memoCountAtom);
  const [, setSearchValue] = useAtom(searchValueAtom);
  const [, setSelectedDate] = useAtom(selectedDateAtom);

  /** 创建缓存键 */
  const createCacheKey = (userId: string, page: number, full = false) => {
    return `${API_GET_MEMO}?userId=${userId}&page=${page}&pageSize=10${
      full ? "&full=true" : ""
    }`;
  };

  /** 创建序列化的缓存键 */
  const createSerializedKey = (userId: string) => {
    return unstable_serialize((index) =>
      index === 0
        ? createCacheKey(userId, 1, true)
        : createCacheKey(userId, index + 1)
    );
  };

  /** 重新验证数据 */
  const revalidateData = async (userId: string) => {
    return mutate<CacheDataResponse>(
      (key: string) => key.startsWith(API_GET_MEMO) && key.includes(userId)
    );
  };

  /** 创建乐观更新数据 */
  const createOptimisticData = (
    message: string,
    userId: string
  ): OptimisticData => ({
    _id: Date.now().toString(),
    message,
    userId,
    createdAt: new Date().toISOString(),
  });

  /** 更新全局状态 */
  const updateGlobalState = (updatedFullData: any[]) => {
    startTransition(() => {
      setSearchValue("");
      setSelectedDate(null);
      setMemoData(updatedFullData);
      setMemoCount((prev) => prev + 1);
    });
  };

  /** 处理表单提交和数据更新 */
  const [state, action] = useActionState<ActionState, FormData>(
    async (_state, formData) => {
      const message = formData.get("message") as string;
      if (message === DEFAULT_MESSAGE) {
        return _state;
      }

      /** 创建乐观更新数据 */
      const optimisticData = createOptimisticData(message, userId);
      const serializedKey = createSerializedKey(userId);

      /** 乐观更新第一页数据 */
      mutate<CacheData[]>(
        serializedKey,
        (currentData: CacheData[] | undefined) => {
          if (!currentData?.[0]?.data) return currentData || [];
          const firstPage = currentData[0];

          const updatedFullData = firstPage.fullData
            ? [optimisticData, ...firstPage.fullData]
            : [optimisticData, ...firstPage.data];

          updateGlobalState(updatedFullData);

          return [
            {
              ...firstPage,
              data: [optimisticData, ...firstPage.data],
              fullData: updatedFullData,
              totalCount: (firstPage.totalCount || 0) + 1,
            },
            ...currentData.slice(1),
          ];
        },
        { revalidate: false } /** 不重新验证缓存, 防止重复发送 */
      );

      /** 发送请求 */
      const response = await axios.post(API_PUT_MEMO, {
        message,
        userId,
      });

      if (!response.data.success) {
        await revalidateData(userId);
        toast.error("发送失败", TOAST_CONFIG);
        return { status: "error", message: "发送失败" };
      }

      /** 更新缓存中的临时 ID 为真实 ID */
      const realId = response.data.data._id;
      await mutate<CacheData[]>(
        serializedKey,
        (currentData: CacheData[] | undefined) => {
          if (!currentData?.[0]?.data) return currentData || [];
          const firstPage = currentData[0];

          const updateMemoId = (memo: MemoItem) =>
            memo._id === optimisticData._id ? { ...memo, _id: realId } : memo;

          return [
            {
              ...firstPage,
              data: firstPage.data.map(updateMemoId),
              fullData: firstPage.fullData
                ? firstPage.fullData.map(updateMemoId)
                : undefined,
            },
            ...currentData.slice(1),
          ];
        },
        { revalidate: false }
      );

      /** 发送成功后重新获取数据，但保持乐观更新的状态 */
      await revalidateData(userId);
      toast.success("发送成功", TOAST_CONFIG);
      startTransition(() => {
        setMessage(DEFAULT_MESSAGE);
      });
      return { status: "success" };
    },
    { status: "idle", message: undefined }
  );

  /** 处理编辑器内容变化 */
  const handleTxtChange = (newMessage: string) => {
    /** 立即更新消息内容 */
    setMessage(newMessage);
    /** 使用 startTransition 处理非紧急的高度更新 */
    startTransition(() => {
      if (fixedRef.current) {
        editorHeight(fixedRef.current.clientHeight);
      }
    });
  };

  /** 聚焦编辑器 */
  useEffect(() => {
    const editor = quillRef.current;
    if (editor) {
      editor.focus();
    }
  }, []);

  const isValidMessage = Boolean(message) && message !== DEFAULT_MESSAGE;

  return (
    <div className='fixed-div' ref={fixedRef}>
      <figure>
        <div className='topbar-div'>
          <span className='title-span'>Memo</span>
          <Search />
        </div>
        <form action={action}>
          <input type='hidden' name='message' value={message} />
          <Suspense fallback={<Loading spinning={isPending} />}>
            <LazyReactQuill
              value={message}
              modules={modules}
              formats={formats}
              ref={quillRef}
              placeholder='现在的想法是...'
              onChange={handleTxtChange}
            />
          </Suspense>
          <SubmitButton isValidMessage={isValidMessage} />
        </form>
        {state.status === "error" && (
          <div className='error-message'>{state.message}</div>
        )}
      </figure>
    </div>
  );
};

export default MemoEditor;
