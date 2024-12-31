import mongoose from "mongoose";
import { toZonedTime } from "date-fns-tz";
import { format, parse } from "date-fns";

const TIMEZONE = "Asia/Shanghai";

/** 定义 Schema */
const DataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      get: function (date) {
        if (!(date instanceof Date)) return date;
        return format(toZonedTime(date, TIMEZONE), "yyyy-MM-dd HH:mm:ss");
      },
      set: function (dateString) {
        if (typeof dateString !== "string") return dateString;
        return toZonedTime(
          parse(dateString, "yyyy-MM-dd HH:mm:ss", new Date()),
          TIMEZONE
        );
      },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
    toJSON: { getters: true },
    toObject: { getters: true },
    autoIndex: false, // 禁用自动索引
  }
);

/** 创建模型 */
const Data = mongoose.model("Data", DataSchema);

export default Data;
