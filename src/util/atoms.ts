import { atom } from "jotai";

export const searchValueAtom = atom(""); // 搜索值
export const memoCountAtom = atom(0); // memo 数量
export const memoDataAtom = atom<any[]>([]); // memo 数据
export const selectedDateAtom = atom<string | null>(null); // 热力图中选中的日期
