import { useRouter } from "next/router";
// ...other imports...
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { RtmChannel } from "agora-rtm-sdk";
import {
  ICameraVideoTrack,
  IRemoteVideoTrack,
  IAgoraRTCClient,
  IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

type TCreateRoomResponse = {
  room: Room;
  rtcToken: string;
  rtmToken: string;
};

type TGetRandomRoomResponse = {
  rtcToken: string;
  rtmToken: string;
  rooms: Room[];
};

type Room = {
  _id: string;
  status: string;
};

type TMessage = {
  userId: string;
  message: string | undefined;
};

function createRoom(userId: string, topic: string): Promise<TCreateRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}&topic=${encodeURIComponent(topic)}`, {
    method: "POST",
  }).then((response) => response.json());
}

function getRandomRoom(userId: string, topic: string): Promise<TGetRandomRoomResponse> {
  return fetch(`/api/rooms?userId=${userId}&topic=${encodeURIComponent(topic)}`).then((response) =>
    response.json()
  );
}

function setRoomToWaiting(roomId: string) {
  return fetch(`/api/rooms?roomId=${roomId}`, { method: "PUT" }).then((response) =>
    response.json()
  );
}

export const VideoPlayer = ({
  videoTrack,
  style,
}: {
  videoTrack: IRemoteVideoTrack | ICameraVideoTrack;
  style: object;
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const playerRef = ref.current;
    if (!videoTrack) return;
    if (!playerRef) return;

    videoTrack.play(playerRef);

    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return <div ref={ref} style={style}></div>;
};

async function connectToAgoraRtc(
  roomId: string,
  userId: string,
  onVideoConnect: any,
  onWebcamStart: any,
  onAudioConnect: any,
  token: string
) {
  const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");

  const client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8",
  });

  await client.join(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    roomId,
    token,
    userId
  );

  client.on("user-published", (themUser, mediaType) => {
    client.subscribe(themUser, mediaType).then(() => {
      if (mediaType === "video") {
        onVideoConnect(themUser.videoTrack);
      }
      if (mediaType === "audio") {
        onAudioConnect(themUser.audioTrack);
        themUser.audioTrack?.play();
      }
    });
  });

  const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  onWebcamStart(tracks[1]);
 
  await client.publish(tracks);

  return { tracks, client };
}

async function connectToAgoraRtm(
  roomId: string,
  userId: string,
  onMessage: (message: TMessage) => void,
  token: string
) {
  const { default: AgoraRTM } = await import("agora-rtm-sdk");
  const client = AgoraRTM.createInstance(process.env.NEXT_PUBLIC_AGORA_APP_ID!);
  await client.login({
    uid: userId,
    token,
  });
  const channel = await client.createChannel(roomId);
  await channel.join();
  channel.on("ChannelMessage", (message, userId) => {
    onMessage({
      userId,
      message: message.text,
    });
  });

  return {
    channel,
  };
}

export default function Home() {
  const [userId] = useState(parseInt(`${Math.random() * 1e6}`) + "");
  const [room, setRoom] = useState<Room | undefined>();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [input, setInput] = useState("");
  const [themVideo, setThemVideo] = useState<IRemoteVideoTrack>();
  const [myVideo, setMyVideo] = useState<ICameraVideoTrack>();
  const [themAudio, setThemAudio] = useState<IRemoteAudioTrack>();
  const [myAudio, setMyAudio] = useState<any>();
  const [previewVideo, setPreviewVideo] = useState<ICameraVideoTrack>();
  const channelRef = useRef<RtmChannel>(null);
  const rtcClientRef = useRef<IAgoraRTCClient>(null);
  const router = useRouter();
const topic = typeof router.query.topic === "string" ? router.query.topic : "Debate";

  function handleNextClick() {
    connectToARoom();
  }

  function handleStartChattingClicked() {
    connectToARoom();
  }

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    await channelRef.current?.sendMessage({
      text: input,
    });
    setMessages((cur) => [
      ...cur,
      {
        userId,
        message: input,
      },
    ]);
    setInput("");
  }

  async function connectToARoom() {
    setThemAudio(undefined);
    setThemVideo(undefined);
    setMyVideo(undefined);
    setMessages([]);

    if (channelRef.current) {
      await channelRef.current.leave();
    }

    if (rtcClientRef.current) {
      rtcClientRef.current.leave();
    }

    const { rooms, rtcToken, rtmToken } = await getRandomRoom(userId, topic);

    if (room) {
      setRoomToWaiting(room._id);
    }

    if (rooms.length > 0) {
      setRoom(rooms[0]);
      const { channel } = await connectToAgoraRtm(
        rooms[0]._id,
        userId,
        (message: TMessage) => setMessages((cur) => [...cur, message]),
        rtmToken
      );
      channelRef.current = channel;

      const { tracks, client } = await connectToAgoraRtc(
        rooms[0]._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
        (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
        rtcToken
      );
      setMyAudio(tracks[0]); // <-- Set audio track here
      rtcClientRef.current = client;
    } else {
      const { room, rtcToken, rtmToken } = await createRoom(userId, topic);
      setRoom(room);
      const { channel } = await connectToAgoraRtm(
        room._id,
        userId,
        (message: TMessage) => setMessages((cur) => [...cur, message]),
        rtmToken
      );
      channelRef.current = channel;

      const { tracks, client } = await connectToAgoraRtc(
        room._id,
        userId,
        (themVideo: IRemoteVideoTrack) => setThemVideo(themVideo),
        (myVideo: ICameraVideoTrack) => setMyVideo(myVideo),
        (themAudio: IRemoteAudioTrack) => setThemAudio(themAudio),
        rtcToken
      );
      setMyAudio(tracks[0]); // <-- Set audio track here
      rtcClientRef.current = client;
    }
  }

  function convertToYouThem(message: TMessage) {
    return message.userId === userId ? "You" : "Them";
  }

  const isChatting = !!room;

  // Add mute/end/report handlers if you want them to work
  const [muted, setMuted] = useState(false);
  const handleMute = () => {
    if (myAudio) {
      myAudio.setEnabled(muted); // Toggle to the opposite of current muted state
      setMuted(!muted);
    }
  };
  const handleEnd = async () => {
    if (room?._id) {
      await fetch(`/api/rooms?roomId=${room._id}`, { method: "PUT" });
    }
    if (myVideo) myVideo.setEnabled(false);
    if (rtcClientRef.current) rtcClientRef.current.leave();
    setRoom(undefined);
    setMyVideo(undefined);
    setThemVideo(undefined);
    setThemAudio(undefined);
    setMessages([]);
  };

  async function startPreviewCamera() {
    if (!previewVideo) {
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setPreviewVideo(tracks[1]);
      // Optionally: tracks[0].setEnabled(false); // mute mic for preview
    }
  }

  useEffect(() => {
    if (!isChatting) {
      startPreviewCamera();
    } else {
      if (previewVideo) {
        previewVideo.stop();
        setPreviewVideo(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatting]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (room?._id) {
        fetch(`/api/rooms?roomId=${room._id}`, {
          method: "PUT",
          keepalive: true,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [room]);

  return (
    <>
      <Head>
        <title>Debate Topic: Climate Change Policy</title>
        <meta name="description" content="Debate Topic: Climate Change Policy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{`
        .animated-bg {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #010a1a 0%, #0b3d79 25%, #3a6ea5 50%, #60a5fa 75%, #010a1a 100%);
          background-size: 600% 600%;
          animation: gradientBG 24s ease-in-out infinite;
        }
        @keyframes gradientBG {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .video-box {
          border: 4px solid;
          border-image: linear-gradient(135deg, #010a1a, #0b3d79, #3a6ea5) 1;
          border-radius: 16px;
          overflow: hidden;
          background: #0b1630;
          min-width: 320px;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
      `}</style>
      <div className="animated-bg">
        <header
  style={{
    background: "transparent",
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: "center",
    boxShadow: "none",
    border: "none",
  }}
>
  Debate Topic: {topic}
</header>
        {room && (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#888",
              marginTop: 4,
              marginBottom: 0,
              letterSpacing: 1,
              userSelect: "all",
            }}
          >
            Room ID: <span style={{ fontFamily: "monospace" }}>{room._id}</span>
          </div>
        )}

        {isChatting ? (
          <>
            <div className="container">
              <div className="video-box">
                {myVideo ? (
                  <>
                    <VideoPlayer
                      style={{ width: "100%", height: "100%" }}
                      videoTrack={myVideo}
                    />
                    <div className="you-label">You</div>
                  </>
                ) : (
                  <div className="loading-box">
                    <div className="spinner"></div>
                    <p>Loading your camera...</p>
                  </div>
                )}
              </div>
              <div className="video-box">
                {themVideo ? (
                  <VideoPlayer
                    style={{ width: "100%", height: "100%" }}
                    videoTrack={themVideo}
                  />
                ) : (
                  <div className="loading-box">
                    <div className="spinner"></div>
                    <p>Waiting for Match...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="controls">
              <button className="mute-btn" onClick={handleMute}>
                {muted ? "🔇 Unmute" : "🔈 Mute"}
              </button>
              <button className="end-btn" onClick={handleEnd}>
                📞 End Call
              </button>
              <button className="report-btn" onClick={() => alert("Reported!")}>
                ⚑ Report
              </button>
              <button
                style={{
                  background: "#5e4fd9",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
                onClick={handleNextClick}
              >
                ⏭ Next
              </button>
            </div>

            <div className="chat-container">
              <div className="chat-box" id="chatBox">
                {messages.map((message, idx) => (
                  <div className="chat-message" key={idx}>
                    {convertToYouThem(message)}: {message.message}
                  </div>
                ))}
              </div>
              <form
                className="chat-input-container"
                onSubmit={handleSubmitMessage}
                autoComplete="off"
              >
                <input
                  type="text"
                  value={input}
                  placeholder="Type your message here..."
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitMessage(e);
                  }}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
              <div className="video-box" style={{ marginBottom: 24 }}>
                {previewVideo ? (
                  <VideoPlayer
                    style={{ width: "100%", height: "100%" }}
                    videoTrack={previewVideo}
                  />
                ) : (
                  <div className="loading-box">
                    <div className="spinner"></div>
                    <p>Loading your camera...</p>
                  </div>
                )}
                <div className="you-label">Preview</div>
              </div>
              <button
                onClick={handleStartChattingClicked}
                style={{
                  fontSize: 20,
                  padding: "15px 40px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #010a1a 0%, #0b3d79 25%, #3a6ea5 50%, #60a5fa 75%, #010a1a 100%)",
                  color: "#fff",
                  border: "none",
                  marginBottom: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(94,79,217,0.12)",
                }}
              >
                Start Chatting
              </button>
              <button
                onClick={() => router.push("/")}
                style={{
                  fontSize: 16,
                  padding: "10px 24px",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#192568ff",
                  border: "2px solid #042055ff",
                  cursor: "pointer",
                }}
              >
                Choose New Topic
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
