import { useEffect, useState, memo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface LazyReactQuillProps {
  value: string;
  onChange: (content: string) => void;
  modules: any;
  formats: string[];
  placeholder: string;
  ref: React.RefObject<ReactQuill>;
}

const LazyReactQuill = React.forwardRef<
  ReactQuill,
  Omit<LazyReactQuillProps, "ref">
>((props, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ReactQuill {...props} ref={ref as any} />;
});

export default memo(LazyReactQuill);
