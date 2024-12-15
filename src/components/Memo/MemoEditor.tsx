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
import { toast, Zoom } from "react-toastify";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "../Common/loading";

const LazyReactQuill = lazy(() => import("../Common/LazyReactQuill"));

const DEFAULT_MESSAGE = "<p><br></p>";
const TOAST_CONFIG = { transition: Zoom, autoClose: 1000 };

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// 提取 SubmitButton 组件
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

interface MemoEditorProps {
  editorHeight: (height: number) => void;
}

const MemoEditor: FC<MemoEditorProps> = ({ editorHeight }) => {
  const { user, isAuthenticated } = useAuth0();
  const quillRef = useRef<any>(null);
  const fixedRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  const [isPending, startTransition] = useTransition();

  const revalidateData = async (userId: string) => {
    return mutate(
      [API_GET_MEMO, "", userId],
      async () => {
        const { data } = await axios.get(API_GET_MEMO, {
          params: { message: "", userId },
        });
        return data.data;
      },
      {
        revalidate: true,
        populateCache: true,
      }
    );
  };

  // 使用 useActionState 处理异步操作
  const [state, action] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      if (!isAuthenticated || !user?.sub) {
        toast.error("请先登录", TOAST_CONFIG);
        return { status: "error" as const, message: "请先登录" };
      }

      const message = formData.get("message") as string;
      if (message === DEFAULT_MESSAGE) {
        return prevState;
      }

      const optimisticData = {
        _id: Date.now().toString(),
        message,
        createdAt: new Date().toISOString(),
      };

      // 乐观更新
      mutate(
        [API_GET_MEMO, "", user.sub],
        (currentData: any[] = []) => [optimisticData, ...currentData],
        false
      );

      const {
        data: { success },
      } = await axios.post(API_PUT_MEMO, {
        message,
        userId: user.sub,
      });

      if (!success) {
        mutate([API_GET_MEMO, "", user.sub]);
        toast.error("发送失败", TOAST_CONFIG);
        return { status: "error" as const, message: "发送失败" };
      }

      await revalidateData(user.sub);
      toast.success("发送成功", TOAST_CONFIG);
      startTransition(() => {
        setMessage(DEFAULT_MESSAGE);
      });
      return { status: "success" as const };
    },
    { status: "idle" }
  );

  const handleTxtChange = (newMessage: string) => {
    // 立即更新消息内容
    setMessage(newMessage);
    // 使用 startTransition 处理非紧急的高度更新
    startTransition(() => {
      if (fixedRef.current) {
        editorHeight(fixedRef.current.clientHeight);
      }
    });
  };

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
