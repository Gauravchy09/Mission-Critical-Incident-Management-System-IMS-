import mongoose, { Schema, Document } from 'mongoose';

export interface ISignal extends Document {
    componentId: string;
    type: string; // e.g., 'ERROR', 'LATENCY'
    payload: any;
    timestamp: Date;
    workItemId?: string; // Linked Work Item in Postgres
}

const SignalSchema: Schema = new Schema({
    componentId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    workItemId: { type: String, index: true },
});

export default mongoose.model<ISignal>('Signal', SignalSchema);
