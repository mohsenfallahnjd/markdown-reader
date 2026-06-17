import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0f0f0f",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="#7c6af7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="#7c6af7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="16" y1="13" x2="8" y2="13" stroke="#9b8cff" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="17" x2="8" y2="17" stroke="#9b8cff" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="9" x2="8" y2="9" stroke="#9b8cff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
