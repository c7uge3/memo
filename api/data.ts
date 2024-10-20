import mongoose from "mongoose";
import moment from "moment-timezone";

const DataSchema = new mongoose.Schema(
  {
    userId: String,
    message: String,
    createdAt: {
      type: Date,
      default: () => moment().tz("Asia/Shanghai").toDate(),
      get: (date: Date) =>
        moment(date).tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss"),
      set: (date: string) =>
        moment(date, "YYYY-MM-DD HH:mm:ss").tz("Asia/Shanghai").toDate(),
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

export default mongoose.model("Data", DataSchema);
