import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionTitle: string;
  candidateName: string;
  date: Date;
  durationSecs: number;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  transcript: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionTitle: { type: String, required: true },
    candidateName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    durationSecs: { type: Number, required: true },
    technicalScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    feedback: {
      strengths: [{ type: String }],
      improvements: [{ type: String }],
    },
    transcript: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.InterviewSession || mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
