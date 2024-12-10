import { type FC, useState, cache, Suspense } from "react";
import {
  format,
  subMonths,
  startOfWeek,
  addDays,
  isAfter,
  parseISO,
} from "date-fns";
import { useAtom } from "jotai";
import { selectedDateAtom } from "../../util/atoms";

// 热力图数据类型
interface ActivityData {
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

// 使用 cache 缓存颜色计算
const getColor = cache((count: number): string => {
  if (count === 0) return "#ebedf0";
  if (count < 3) return "#c6ceff";
  if (count < 6) return "#a7b3ff";
  if (count < 9) return "#8898ff";
  return "#637dff";
});

// 使用 cache 缓存热力图数据计算
const calculateWeeksData = cache((data: ActivityData[]) => {
  // 使用 Map 优化查找性能
  const activityData = new Map(data.map(({ date, count }) => [date, count]));
  const result: ActivityData[][] = [];
  let currentWeek: ActivityData[] = [];
  const startDate = startOfWeek(subMonths(new Date(), 3));
  const endDate = new Date();

  let currentDate = startDate;
  while (!isAfter(currentDate, endDate)) {
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    currentWeek.push({
      date: formattedDate,
      count: activityData.get(formattedDate) || 0,
    });

    if (currentWeek.length === 7 || isAfter(addDays(currentDate, 1), endDate)) {
      result.push(currentWeek);
      currentWeek = [];
    }

    currentDate = addDays(currentDate, 1);
  }

  return result;
});

// 使用 cache 缓存日期格式化
const formatDate = cache((date: string) => {
  return format(parseISO(date), "yyyy-MM-dd");
});

// 热力图弹出框组件
const Popup: FC<PopupProps> = ({ date, count, position }) => (
  <div
    className='heatmap-popup'
    style={{
      left: `${position.x - 36}px`,
      top: `${position.y + 6}px`,
    }}>
    <div className='popup-date'>{formatDate(date)}</div>
    <div className='popup-count'>{count} 条笔记</div>
  </div>
);

const Heatmap: FC<HeatmapProps> = ({ data }) => {
  const [popup, setPopup] = useState<PopupProps | null>(null);
  const [, setSelectedDate] = useAtom(selectedDateAtom);

  // 使用 cache 处理数据
  const weeksData = calculateWeeksData(data);

  function handleMouseEnter(day: ActivityData, event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopup({
      date: day.date,
      count: day.count,
      position: { x: rect.left, y: rect.bottom + window.scrollY },
    });
  }

  function handleMouseLeave() {
    setPopup(null);
  }

  function handleDayClick(day: ActivityData) {
    setSelectedDate(day.date);
  }

  return (
    <div className='activity-heatmap'>
      {weeksData.map((week, weekIndex) => (
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
      <Suspense fallback={null}>{popup && <Popup {...popup} />}</Suspense>
    </div>
  );
};

export default Heatmap;
