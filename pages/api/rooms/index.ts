// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../libs/dbConnect";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { RtmTokenBuilder, RtmRole } from "agora-access-token";
import Room from "../../../models/Room";

type Room = {
  status: String;
};

type ResponseData = Room[] | string;

function getRtmToken(userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERT!;
  const account = userId;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const token = RtmTokenBuilder.buildToken(
    appID,
    appCertificate,
    account,
    RtmRole.Rtm_User,
    privilegeExpiredTs
  );
  return token;
}

function getRtcToken(roomId: string, userId: string) {
  const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERT!;
  const channelName = roomId;
  const account = userId;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appID,
    appCertificate,
    channelName,
    account,
    role,
    privilegeExpiredTs
  );

  return token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { method, query } = req;
  const userId = query.userId as string;
  const topic = query.topic as string;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        // Only match rooms with the same topic
        const rooms = await Room.aggregate([
          { $match: { status: "waiting", topic } },
          { $sample: { size: 1 } },
        ]);
        if (rooms.length > 0) {
          const roomId = rooms[0]._id.toString();
          // Increment userCount and set status to "chatting"
          await Room.findByIdAndUpdate(
            roomId,
            { $set: { status: "chatting" }, $inc: { userCount: 1 } }
          );
          res.status(200).json({
            rooms,
            rtcToken: getRtcToken(roomId, userId),
            rtmToken: getRtmToken(userId),
          });
        } else {
          res.status(200).json({ rooms: [], token: null });
        }
      } catch (error) {
        res.status(400).json((error as any).message);
      }
      break;
    case "POST":
      // Store the topic in the new room
      const room = await Room.create({
        status: "waiting",
        userCount: 1,
        topic, // Save topic
      });
      res.status(200).json({
        room,
        rtcToken: getRtcToken(room._id.toString(), userId),
        rtmToken: getRtmToken(userId),
      });
      break;
    case "DELETE": {
      try {
        const { roomId } = query;

        // Delete specific room by ID
        if (roomId) {
          await Room.findByIdAndDelete(roomId);
        }

        // Delete all rooms with status "empty"
        await Room.deleteMany({ status: "empty" });

        res.status(200).json({ message: "Room(s) deleted" });
      } catch (error) {
        res.status(400).json({ error: (error as any).message });
      }
      break;
    }
    case "PUT": {
      try {
        const { roomId } = query;
        if (roomId) {
          const room = await Room.findById(roomId);
          if (!room) {
            res.status(404).json({ error: "Room not found" });
            return;
          }
          // Decrement userCount
          room.userCount = Math.max(0, (room.userCount || 1) - 1);
          if (room.userCount === 0) {
            room.status = "empty";
            await room.save();
            await Room.findByIdAndDelete(roomId);
            res.status(200).json({ message: "Room set to empty and deleted" });
          } else if (room.userCount === 1) {
            room.status = "waiting";
            await room.save();
            res.status(200).json({ message: "Room set to waiting" });
          } else if (room.userCount === 2) {
            room.status = "chatting";
            await room.save();
            res.status(200).json({ message: "Room set to chatting" });
          }
        } else {
          res.status(400).json({ error: "roomId is required" });
        }
      } catch (error) {
        res.status(400).json({ error: (error as any).message });
      }
      break;
    }
    default:
      res.status(400).json("no method for this endpoint");
      break;
  }
}
