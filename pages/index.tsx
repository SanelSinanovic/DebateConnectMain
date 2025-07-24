import { useRouter } from "next/router";
import { useState } from "react";

const TOPICS = [
  "Climate Change Policy",
  "Universal Basic Income",
  "AI Regulation",
  "Online Privacy",
  "Renewable Energy",
  "Education Reform",
];

export default function Landing() {
  const router = useRouter();
  const [topic, setTopic] = useState(TOPICS[0]);

  const handleJoin = () => {
    router.push(`/debate?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <>
      <style jsx global>{`
        .animated-bg {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #010a1a 0%, #0b3d79 40%, #3a6ea5 60%, #010a1a 100%);
          background-size: 200% 200%;
          animation: gradientBG 12s ease-in-out infinite;
          position: relative;
        }
        .debate-title {
          position: absolute;
          top: 32px;
          left: 40px;
          font-family: 'Segoe UI', 'Arial Rounded MT Bold', Arial, sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 2px;
          text-shadow: 0 2px 12px #010a1a88;
          user-select: none;
          z-index: 10;
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
      `}</style>
      <div className="animated-bg">
        <div className="debate-title">Debate Connect</div>
        <div
          style={{
            border: "3px solid #fff",
            borderRadius: 24,
            boxShadow: "0 4px 32px rgba(94,79,217,0.08)",
            padding: "40px 32px",
            maxWidth: 400,
            textAlign: "center",
            background: "transparent",
            backdropFilter: "blur(0px)", // optional: remove if you don't want any blur
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28, color: "#fff" }}>
            Welcome to the Debate Room
          </h1>
          <p style={{ color: "#fff", margin: "24px 0 32px" }}>
            Join a live video debate on <b>{topic}</b> with a random partner.
          </p>
          <div style={{ position: "relative", width: "100%", marginBottom: 24 }}>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                paddingRight: "36px", // space for arrow
                fontSize: 16,
                borderRadius: 6,
                border: "1px solid #fff",
                outline: "none",
                background: "#0b1630",
                color: "#fff",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              {TOPICS.map(t => (
                <option key={t} value={t} style={{ background: "#0b1630", color: "#fff" }}>
                  {t}
                </option>
              ))}
            </select>
            <span
              style={{
                pointerEvents: "none",
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                color: "#fff",
                opacity: 0.7,
              }}
            >
              ▼
            </span>
          </div>
          <button
            onClick={handleJoin}
            style={{
              background: "linear-gradient(135deg, #010a1a 0%, #0b3d79 25%, #3a6ea5 50%, #60a5fa 75%, #010a1a 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 20,
              padding: "15px 40px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(94,79,217,0.12)",
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            Join Debate
          </button>
        </div>
      </div>
    </>
  );
}