import type { LoadingProps } from "./interface";

const Loading: React.FC<LoadingProps> = ({ spinning, indicator, tip }) => {
  if (!spinning) return null;

  return (
    <div className='sense-loading'>
      {indicator || (
        <div className='lds-ripple'>
          <div />
          <div />
        </div>
      )}
      {tip && <div className='loading-tip'>{tip}</div>}
    </div>
  );
};

export default Loading;
