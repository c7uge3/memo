import React, { memo, useState, useCallback, useMemo } from "react";
import moment from "moment";
import "../style/heatmap.css";

// 热力图数据类型
export interface ActivityData {
  date: string;
  count: number;
}

// 热力图组件的 props 类型
interface HeatmapProps {
  data: ActivityData[];
}

// 热力图弹出框的 props 类型
interface PopupProps {
  date: string;
  count: number;
  position: { x: number; y: number };
}

// 热力图弹出框组件，显示当前日期的笔记数量
const Popup: React.FC<PopupProps> = memo(({ date, count, position }) => (
  <div
    className='heatmap-popup'
    style={{
      left: `${position.x - 36}px`,
      top: `${position.y + 6}px`,
    }}>
    <div className='popup-date'>{moment(date).format("YYYY-MM-DD")}</div>
    <div className='popup-count'>{count} 条笔记</div>
  </div>
));

// 获取相应的颜色
const getColor = (count: number): string => {
  if (count === 0) return "#ebedf0";
  if (count < 3) return "#c6ceff";
  if (count < 6) return "#a7b3ff";
  if (count < 9) return "#8898ff";
  return "#637dff";
};

// 热力图组件
const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const [popup, setPopup] = useState<PopupProps | null>(null);

  // 鼠标进入热力图色块区域时，显示弹出框
  const handleMouseEnter = useCallback(
    (day: ActivityData, event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopup({
        date: day.date,
        count: day.count,
        position: { x: rect.left, y: rect.bottom + window.scrollY },
      });
    },
    []
  );

  // 鼠标离开热力图色块区域时，隐藏弹出框
  const handleMouseLeave = useCallback(() => {
    setPopup(null);
  }, []);

  // 生成热力图数据
  const weeks = useMemo(() => {
    const result = []; // 最终结果
    let currentWeek = []; // 当前周的数据
    const startDate = moment().subtract(3, "months").startOf("week"); // 从当前日期开始，往前推3个月，并设置为周的开始日期
    const endDate = moment(); // 结束日期为当前日期

    // 当开始日期小于等于结束日期时，遍历每一天的数据
    while (startDate.isSameOrBefore(endDate)) {
      const dayData = data.find(
        (d) => d.date === startDate.format("YYYY-MM-DD")
      ) || { date: startDate.format("YYYY-MM-DD"), count: 0 };
      currentWeek.push(dayData); // 将当前天的数据添加到当前周

      // 如果当前周的数据满了7天，或者已经遍历到结束日期，则将当前周的数据添加到结果中，并重置 currentWeek
      if (currentWeek.length === 7 || startDate.isSame(endDate, "day")) {
        result.push(currentWeek);
        currentWeek = [];
      }

      startDate.add(1, "day"); // 移动到下一天
    }

    return result;
  }, [data]);

  return (
    <>
      <div className='activity-heatmap'>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className='week'>
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className='day'
                style={{ backgroundColor: getColor(day.count) }}
                onMouseEnter={(e) => handleMouseEnter(day, e)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </div>
        ))}
      </div>
      {popup && <Popup {...popup} />}
    </>
  );
};

export default memo(Heatmap);
