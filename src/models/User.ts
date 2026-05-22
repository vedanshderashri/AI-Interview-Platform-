import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  isOnboarded: boolean;
  careerGoals?: string;
  targetDomains: string[];
  experienceLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    isOnboarded: { type: Boolean, default: false },
    careerGoals: { type: String },
    targetDomains: [{ type: String }],
    experienceLevel: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
