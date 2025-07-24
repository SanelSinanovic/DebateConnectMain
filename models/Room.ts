import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  status: String,
  userCount: { type: Number, default: 1 },
  topic: String, // Add this line
});

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
