import {
  type FC,
  useState,
  useEffect,
  cache,
  Suspense,
  useRef,
  startTransition,
} from "react";
import {
  format,
  subMonths,
  startOfWeek,
  addDays,
  isAfter,
  parseISO,
  startOfDay,
  endOfDay,
  isBefore,
  isEqual,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useAtom } from "jotai";
import {
  selectedDateAtom,
  memoDataAtom,
  memoCountAtom,
  searchValueAtom,
} from "../../util/atoms";
import { mutate } from "swr";
import { API_GET_MEMO } from "@/util/apiURL";

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

// 颜色映射配置
const COLOR_MAP = {
  0: "#ebedf0",
  1: "#c6ceff",
  2: "#c6ceff",
  3: "#a7b3ff",
  4: "#a7b3ff",
  5: "#a7b3ff",
  6: "#8898ff",
  7: "#8898ff",
  8: "#8898ff",
} as const;

const TIMEZONE = "Asia/Shanghai";

/**
 * 获取热力图颜色
 * @param count 活动次数
 * @returns 对应的颜色值
 */
const getColor = cache((count: number): string => {
  if (count >= 9) return "#637dff";
  return COLOR_MAP[count as keyof typeof COLOR_MAP] || COLOR_MAP[0];
});

/**
 * 格式化日期
 * @param dateString ISO 格式的日期符串
 * @returns 格式化后的日期字符串
 */
const formatDate = cache((dateString: string) => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd");
});

/**
 * 计算热力图周数据
 * @param data 活动数据数组
 * @returns 按周组织的活动数据
 */
const calculateWeeksData = cache((data: ActivityData[]) => {
  /** 创建活动数据映射 */
  const activityMap = new Map();

  /** 处理日期并统计活动次数 */
  data.forEach(({ date, count }) => {
    const formattedDate = formatDate(date);
    activityMap.set(
      formattedDate,
      (activityMap.get(formattedDate) || 0) + count
    );
  });

  const result: ActivityData[][] = [];
  let currentWeek: ActivityData[] = [];

  /** 使用当前时区的时间 */
  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE);
  const startDate = startOfWeek(subMonths(zonedNow, 3));
  const endDate = zonedNow;

  let currentDate = startDate;

  /** 预分配数组空间 */
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weeks = Math.ceil(totalDays / 7);
  result.length = weeks;

  /** 填充周数据 */
  let weekIndex = 0;
  while (!isAfter(currentDate, endDate)) {
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    currentWeek.push({
      date: formattedDate,
      count: activityMap.get(formattedDate) || 0,
    });

    if (currentWeek.length === 7 || isAfter(addDays(currentDate, 1), endDate)) {
      result[weekIndex] = currentWeek;
      currentWeek = [];
      weekIndex++;
    }

    currentDate = addDays(currentDate, 1);
  }

  return result.filter(Boolean);
});

/**
 * 热力图弹出框组件
 */
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

/**
 * 热力图组件
 * 展示过去三个月的活动数据，支持日期选择和数据预览
 */
const Heatmap: FC<HeatmapProps> = ({ data }) => {
  const [popup, setPopup] = useState<PopupProps | null>(null);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [, setSearchValue] = useAtom(searchValueAtom);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [memoData] = useAtom(memoDataAtom);
  const [memoCount] = useAtom(memoCountAtom);
  const [currentData, setCurrentData] = useState(data);
  const fullDataRef = useRef<any[]>([]);

  /** 监听数据变化并更新 */
  useEffect(() => {
    if (memoData?.length) {
      // 只在非筛选状态下更新完整数据
      if (!selectedDate) {
        fullDataRef.current = memoData;
      }
    }

    // 计算热力图数据
    const dataToUse = fullDataRef.current;
    if (dataToUse?.length) {
      const newData = calculateActivityData(dataToUse);
      setCurrentData(newData);
    } else {
      setCurrentData(data);
    }
  }, [memoData, memoCount, selectedDate]);

  /** 计算热力图数据 */
  const calculateActivityData = (dataToUse: any[]) => {
    if (!dataToUse?.length) return data;

    const activityMap = new Map();
    const now = new Date();
    const endDate = endOfDay(toZonedTime(now, TIMEZONE));
    let startDate = startOfDay(toZonedTime(subMonths(now, 3), TIMEZONE));

    /** 初始化日期范围 */
    while (isBefore(startDate, endDate) || isEqual(startDate, endDate)) {
      activityMap.set(format(startDate, "yyyy-MM-dd"), 0);
      startDate = addDays(startDate, 1);
    }

    /** 统计活动数据 */
    for (const item of dataToUse) {
      if (item?.createdAt) {
        const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
        if (isAfter(itemDate, toZonedTime(subMonths(now, 3), TIMEZONE))) {
          const date = format(itemDate, "yyyy-MM-dd");
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
      }
    }

    return Array.from(activityMap, ([date, count]) => ({ date, count }));
  };

  /** 计算热力图数据 */
  const weeksData = calculateWeeksData(currentData);

  /**
   * 处理鼠标悬停事件
   * 显示日期活动详情
   */
  const handleMouseEnter = (day: ActivityData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopup({
      date: day.date,
      count: day.count,
      position: { x: rect.left, y: rect.bottom + window.scrollY },
    });
  };

  const handleMouseLeave = () => {
    setPopup(null);
  };

  /**
   * 处理日期单元格点击
   * 支持选择和取消选择
   */
  const handleDayClick = (day: ActivityData) => {
    if (selectedCell === day.date) {
      setSelectedCell(null);
      startTransition(() => {
        setSearchValue("");
        setSelectedDate(null);
        // 重新加载数据
        mutate((key: string) => key.startsWith(API_GET_MEMO), undefined, {
          revalidate: true,
        });
      });
    } else {
      setSelectedCell(day.date);
      startTransition(() => {
        setSearchValue("");
        setSelectedDate(day.date);
      });
    }
  };

  return (
    <div className='activity-heatmap'>
      {weeksData.map((week, weekIndex) => (
        <div key={weekIndex} className='week'>
          {week.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`day ${selectedCell === day.date ? "selected" : ""}`}
              style={{
                backgroundColor: getColor(day.count),
                border:
                  selectedCell === day.date ? "2px solid #637dff" : "none",
                boxSizing: "border-box",
              }}
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
