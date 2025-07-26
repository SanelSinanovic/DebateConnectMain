import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
          overflow: hidden;
        }
        .animated-bg::before,
        .animated-bg::after {
          content: "";
          position: absolute;
          top: 0;
          width: 400px;
          height: 100%;
          background-image: url('/image.png');
          background-repeat: no-repeat;
          background-size: contain;
          opacity: 0.70;
          pointer-events: none;
          z-index: 1;
        }
        .animated-bg::before {
          left: 0;
          background-position: left center;
        }
        .animated-bg::after {
          right: 0;
          background-position: right center;
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
        .menu-bar {
          position: absolute;
          top: 32px;
          right: 40px;
          z-index: 20;
        }
        .menu-btn {
          background: rgba(11, 61, 121, 0.9);
          border: none;
          color: #fff;
          font-size: 2rem;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(94,79,217,0.12);
          transition: background 0.2s;
        }
        .menu-btn:active {
          background: #3a6ea5;
        }
        .menu-dropdown {
          position: absolute;
          top: 48px;
          right: 0;
          background: #0b1630;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          min-width: 180px;
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .menu-item {
          color: #fff;
          padding: 12px 24px;
          text-align: left;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .menu-item:hover {
          background: #1a2a4a;
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
        <div className="menu-bar" ref={menuRef}>
          <button
            className="menu-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            ☰
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button className="menu-item" onClick={() => { setMenuOpen(false); router.push('/privacy'); }}>Privacy</button>
              <button className="menu-item" onClick={() => { setMenuOpen(false); router.push('/faq'); }}>FAQ</button>
              <button className="menu-item" onClick={() => { setMenuOpen(false); router.push('/terms'); }}>Terms of Service</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}