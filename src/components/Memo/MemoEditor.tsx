import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useTransition,
  type FC,
} from "react";
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

const MemoEditor: FC<{
  editorHeight: (editorHeight: number) => void;
}> = ({ editorHeight }) => {
  const { user, isAuthenticated } = useAuth0();
  const quillRef = useRef<any>(null);
  const fixedRef = useRef<{ clientHeight: number }>({ clientHeight: 0 });
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleTxtChange = (newMessage: string) => {
    setMessage(newMessage);
    editorHeight(fixedRef.current.clientHeight);
  };

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

  const putMemo = async (message: string) => {
    if (!isAuthenticated || !user?.sub) {
      toast.error("请先登录", TOAST_CONFIG);
      return;
    }

    if (message === DEFAULT_MESSAGE) {
      return;
    }

    const optimisticData = {
      _id: Date.now().toString(),
      message,
      createdAt: new Date().toISOString(),
    };

    try {
      // 乐观更新列表
      mutate(
        [API_GET_MEMO, "", user.sub],
        async (currentData: any[] = []) => {
          return [optimisticData, ...currentData];
        },
        false
      );

      const {
        data: { success },
      } = await axios.post(API_PUT_MEMO, {
        message,
        userId: user.sub,
      });

      if (success) {
        await revalidateData(user.sub);
        toast.success("发送成功", TOAST_CONFIG);
        startTransition(() => {
          setMessage("");
        });
      } else {
        throw new Error("发送失败");
      }
    } catch (error) {
      // 发生错误时回滚乐观更新
      mutate([API_GET_MEMO, "", user.sub]);
      toast.error(
        error instanceof Error ? error.message : "发送失败",
        TOAST_CONFIG
      );
    }
  };

  useEffect(() => {
    const editor = quillRef.current;
    if (editor) {
      editor.focus();
    }
  }, []);

  const isValidMessage = message && message !== DEFAULT_MESSAGE;

  return (
    <div
      className='fixed-div'
      ref={fixedRef as React.RefObject<HTMLDivElement>}>
      <figure>
        <div className='topbar-div'>
          <span className='title-span'>Memo</span>
          <Search />
        </div>
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
        <input
          type='button'
          value='发送'
          className={isValidMessage ? "send-btn send-btn-enable" : "send-btn"}
          disabled={!isValidMessage || isPending}
          onClick={() => isValidMessage && putMemo(message)}
        />
      </figure>
    </div>
  );
};

export default MemoEditor;
