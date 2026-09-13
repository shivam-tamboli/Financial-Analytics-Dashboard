import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<UserDocument>('User', userSchema);
