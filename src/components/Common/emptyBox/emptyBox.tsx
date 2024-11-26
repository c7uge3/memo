import type { EmptyProps } from "./interface";

const prefixCls = "sense-empty";

const EmptyBox: React.FC<EmptyProps> = ({
  isShow = false,
  description = "暂无数据",
  imageSrc = "src/img/empty.png",
}) => (
  <>
    {isShow ? (
      <div className={prefixCls}>
        <img src={imageSrc} alt='Empty' width={64} height={64} loading='lazy' />
        <label>{description}</label>
      </div>
    ) : null}
  </>
);

export default EmptyBox;
