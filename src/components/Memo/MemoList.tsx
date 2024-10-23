import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAtom } from "jotai";
import { Zoom } from "react-toastify";
import useSWR from "swr";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import Empty from "../Common/emptyBox";
import MemoItem from "./MemoItem";
import { API_GET_MEMO } from "../../util/apiURL";
import {
  searchValueAtom,
  memoCountAtom,
  memoDataAtom,
  selectedDateAtom,
} from "../../util/atoms";

import "../Common/emptyBox/style/index.less";
import "../Common/loading/style/index.less";

interface MemoItem {
  _id: string;
  createdAt: string;
  message: string;
}

interface ListProps {
  listHeight: number;
}

const TIMEZONE = 'Asia/Shanghai';

const MemoList: React.FC<ListProps> = ({ listHeight }) => {
  const [searchValue] = useAtom(searchValueAtom);
  const [operateFlag, setOperateFlag] = useState<boolean>(false);
  const [crtKey, setCrtKey] = useState<number | undefined>(undefined);
  const [, setMemoCount] = useAtom(memoCountAtom);

  const toastObj = useMemo(
    () => ({
      transition: Zoom,
      autoClose: 1000,
    }),
    []
  );

  const { user } = useAuth0();
  const userId = user?.sub;

  const [, setMemoData] = useAtom(memoDataAtom);

  const fetcher = async ([url, message, userId]: [
    string,
    string,
    string
  ]): Promise<MemoItem[]> => {
    const { data } = await axios.get(url, { params: { message, userId } });
    return data.data;
  };

  const { data: listData, error } = useSWR<MemoItem[], Error>(
    [API_GET_MEMO, searchValue, userId],
    fetcher,
    {
      revalidateOnFocus: false,
      suspense: true,
      dedupingInterval: 1000,
      focusThrottleInterval: 1000,
      onSuccess: (data) => {
        setMemoData(data);
      },
    }
  );

  const isNeedOperate = useCallback((flag: string, key: number) => {
    setOperateFlag(flag === "Y");
    setCrtKey(key);
  }, []);

  const updateMemoCount = useCallback((change: number) => {
    setMemoCount((prevCount) => prevCount + change);
  }, []);

  useEffect(() => {
    if (listData) setMemoCount(listData.length);
  }, [listData, searchValue]);

  const [selectedDate] = useAtom(selectedDateAtom);

  const filteredListData = useMemo(() => {
    return listData?.filter((item) => {
      const matchesSearch = item.message
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const itemDate = toZonedTime(parseISO(item.createdAt), TIMEZONE);
      const matchesDate = selectedDate
        ? format(itemDate, "yyyy-MM-dd") === selectedDate
        : true;
      return matchesSearch && matchesDate;
    });
  }, [listData, searchValue, selectedDate]);

  return (
    <>
      {error ? (
        <div style={{ textAlign: "center" }}>加载失败，请稍等或稍后再试</div>
      ) : (
        <ul className='memoCard-ul' style={{ height: listHeight }}>
          {filteredListData && filteredListData.length > 0 ? (
            filteredListData.map((item, index) => (
              <MemoItem
                key={item._id}
                item={item}
                index={index}
                operateFlag={operateFlag}
                crtKey={crtKey}
                isNeedOperate={isNeedOperate}
                toastObj={toastObj}
                updateMemoCount={updateMemoCount}
              />
            ))
          ) : (
            <li className='memoCard-li'>
              <Empty isShow={true} />
            </li>
          )}
        </ul>
      )}
    </>
  );
};

export default memo(MemoList);
