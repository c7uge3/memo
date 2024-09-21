import React, { useState, useEffect } from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setHasError(true);
      setError(error.error);
      console.error("Error caught by ErrorBoundary:", error);
    };

    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div
        className='error-boundary'
        style={{ textAlign: "center", color: "red" }}>
        <h1>出错了，请稍后再试。</h1>
        {process.env.NODE_ENV === "development" && (
          <details style={{ whiteSpace: "pre-wrap" }}>
            {error && error.toString()}
          </details>
        )}
        <button onClick={() => setHasError(false)}>重试</button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;
