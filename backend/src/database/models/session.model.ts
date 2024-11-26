import mongoose, { Document, Schema } from "mongoose";
import { thirtyDaysFromNow } from "../../common/utils/date-time";

export type SessionDocument = Document & {
  userId: Schema.Types.ObjectId;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
};

const sessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  userAgent: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: thirtyDaysFromNow,
  },
});

export const SessionModel = mongoose.model<SessionDocument>(
  "Session",
  sessionSchema
);

export default SessionModel;
