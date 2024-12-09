import { useEffect, useState, forwardRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface LazyReactQuillProps {
  value: string;
  onChange: (content: string) => void;
  modules?: any; // Optional
  formats?: string[]; // Optional
  placeholder?: string; // Optional
}

const LazyReactQuill = forwardRef<ReactQuill, LazyReactQuillProps>(
  ({ value, onChange, modules, formats, placeholder }, ref) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return null;
    }

    const QuillComponent = ReactQuill as any;

    return (
      <QuillComponent
        theme='snow'
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        ref={ref}
      />
    );
  }
);

export default LazyReactQuill;
