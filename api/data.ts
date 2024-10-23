import mongoose from "mongoose";
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { format, parse } from 'date-fns';

const TIMEZONE = 'Asia/Shanghai';

const DataSchema = new mongoose.Schema(
  {
    userId: String,
    message: String,
    createdAt: {
      type: Date,
      default: () => zonedTimeToUtc(new Date(), TIMEZONE),
      get: (date: Date) =>
        format(utcToZonedTime(date, TIMEZONE), "yyyy-MM-dd HH:mm:ss"),
      set: (dateString: string) =>
        zonedTimeToUtc(parse(dateString, "yyyy-MM-dd HH:mm:ss", new Date()), TIMEZONE),
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.model("Data", DataSchema);
