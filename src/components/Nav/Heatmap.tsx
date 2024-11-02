import React, { memo, useState, useCallback, useMemo } from "react";
import {
  format,
  subMonths,
  startOfWeek,
  addDays,
  isSameDay,
  isAfter,
  parseISO,
} from "date-fns";
import { useAtom } from "jotai";
import { memoDataAtom, selectedDateAtom } from "../../util/atoms";

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
    <div className='popup-date'>{format(parseISO(date), "yyyy-MM-dd")}</div>
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
const Heatmap: React.FC<HeatmapProps> = () => {
  const [memoData] = useAtom(memoDataAtom);
  const [popup, setPopup] = useState<PopupProps | null>(null);
  const [, setSelectedDate] = useAtom(selectedDateAtom);

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

  // 使用 memoData 计算活动数据
  const activityData = useMemo(() => {
    const dataMap = new Map<string, number>();

    if (!memoData || !Array.isArray(memoData)) {
      return [];
    }

    memoData.forEach((memo) => {
      if (memo?.createdAt) {
        const date = format(parseISO(memo.createdAt), "yyyy-MM-dd");
        dataMap.set(date, (dataMap.get(date) || 0) + 1);
      }
    });

    return Array.from(dataMap, ([date, count]) => ({ date, count }));
  }, [memoData]);

  // 使用 activityData 替代原来的 data
  const weeks = useMemo(() => {
    if (!activityData || !Array.isArray(activityData)) {
      return [];
    }
    const result = []; // 最终结果
    let currentWeek = []; // 当前周的数据
    let startDate = startOfWeek(subMonths(new Date(), 3)); // 从当前日期开始，往前推3个月，并设置为周的开始日期
    const endDate = new Date(); // 结束日期为当前日期

    // 当开始日期不晚于结束日期时，遍历每一天的数据
    while (!isAfter(startDate, endDate)) {
      const formattedDate = format(startDate, "yyyy-MM-dd");
      const dayData = activityData.find((d) => d.date === formattedDate) || {
        date: formattedDate,
        count: 0,
      };
      currentWeek.push(dayData); // 将当前天的数据添加到当前周

      // 如果当前周的数据满了7天，或者已经遍历到结束日期，则将当前周的数据添加到结果中，并重置 currentWeek
      if (currentWeek.length === 7 || isSameDay(startDate, endDate)) {
        result.push(currentWeek);
        currentWeek = [];
      }

      startDate = addDays(startDate, 1); // 移动到下一天
    }

    return result;
  }, [activityData]);

  const handleDayClick = useCallback((day: ActivityData) => {
    setSelectedDate(day.date);
  }, []);

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
                onClick={() => handleDayClick(day)}
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
