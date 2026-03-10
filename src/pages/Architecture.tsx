import { useState } from "react";

const layers = [
  {
    id: "ds",
    label: "DATA SOURCES",
    color: "#7C3AED",
    bg: "#1a0a3e",
    nodes: [
      { id: "waqi", label: "WAQI API", sub: "Real-time AQI" },
      { id: "weather", label: "Weather API", sub: "Temp · Wind · Humidity" },
      { id: "geojson", label: "GeoJSON Wards", sub: "Delhi Boundaries" },
    ],
  },
  {
    id: "be",
    label: "BACKEND LAYER",
    color: "#EA580C",
    bg: "#1f0c00",
    nodes: [
      { id: "edge", label: "Edge Functions", sub: "Deno / Node.js" },
      { id: "api", label: "REST API", sub: "FastAPI" },
      { id: "postgres", label: "PostgreSQL", sub: "Supabase DB" },
    ],
  },
  {
    id: "ml",
    label: "ML MODELS LAYER",
    color: "#DC2626",
    bg: "#1f0000",
    nodes: [
      { id: "iforest", label: "Isolation Forest", sub: "Anomaly Detection" },
      { id: "rforest", label: "Random Forest", sub: "Pattern Classification" },
      { id: "xgboost", label: "XGBoost", sub: "Hotspot Prediction" },
      { id: "idw", label: "IDW + KNN", sub: "Spatial Interpolation" },
    ],
  },
  {
    id: "llm",
    label: "LLM INTELLIGENCE",
    color: "#DB2777",
    bg: "#1f0015",
    nodes: [
      { id: "mistral", label: "Mistral 7B", sub: "Strong Reasoning" },
      { id: "mixtral", label: "Mixtral 8x7B", sub: "Deep Analysis" },
      { id: "advisory", label: "Advisory Engine", sub: "Health + Policy" },
    ],
  },
  {
    id: "fe",
    label: "FRONTEND LAYER",
    color: "#F5D000",
    bg: "#1a1600",
    nodes: [
      { id: "react", label: "React 18 + TS", sub: "Vite + Tailwind" },
      { id: "leaflet", label: "Leaflet Maps", sub: "Ward Heatmap" },
      { id: "recharts", label: "Recharts", sub: "Trend Visualizer" },
    ],
  },
  {
    id: "dep",
    label: "DEPLOYMENT",
    color: "#0EA5E9",
    bg: "#00111f",
    nodes: [
      { id: "cdn", label: "Vercel / Netlify", sub: "Frontend CDN" },
      { id: "docker", label: "Docker ML", sub: "Containerized" },
      { id: "cloud", label: "AWS / GCP", sub: "Backend Cloud" },
    ],
  },
];

const flows = [
  { from: "waqi", to: "edge", label: "AQI feed" },
  { from: "weather", to: "edge", label: "Weather ctx" },
  { from: "geojson", to: "postgres", label: "Ward data" },
  { from: "edge", to: "iforest", label: "Vectors" },
  { from: "edge", to: "rforest", label: "Vectors" },
  { from: "edge", to: "xgboost", label: "Vectors" },
  { from: "postgres", to: "idw", label: "Historical" },
  { from: "iforest", to: "mistral", label: "Anomalies" },
  { from: "rforest", to: "mistral", label: "Patterns" },
  { from: "xgboost", to: "mixtral", label: "Hotspots" },
  { from: "idw", to: "advisory", label: "Spatial" },
  { from: "mistral", to: "api", label: "Explanations" },
  { from: "mixtral", to: "api", label: "Analysis" },
  { from: "advisory", to: "api", label: "Advisories" },
  { from: "api", to: "react", label: "JSON" },
  { from: "react", to: "leaflet", label: "Ward data" },
  { from: "react", to: "recharts", label: "Trends" },
  { from: "react", to: "cdn", label: "Deploy" },
  { from: "iforest", to: "docker", label: "Container" },
  { from: "rforest", to: "docker", label: "Container" },
  { from: "edge", to: "cloud", label: "Serverless" },
];

export default function Architecture() {
  const [active, setActive] = useState<string | null>(null);

  const activeFlows = active
    ? flows.filter((f) => f.from === active || f.to === active)
    : [];
  const connectedIds = new Set(activeFlows.flatMap((f) => [f.from, f.to]));

  return (
    <div
      style={{
        background: "#080810",
        minHeight: "100vh",
        fontFamily: "'Courier New', monospace",
        padding: "32px 24px",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            color: "#555",
            marginBottom: 8,
          }}
        >
          SYSTEM ARCHITECTURE
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: 4,
            background: "linear-gradient(90deg, #F5D000, #DB2777, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          SHWAAS
        </h1>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 3, marginTop: 6 }}>
          AI-POWERED DELHI AIR QUALITY INTELLIGENCE PLATFORM
        </div>
        {active && (
          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "#888",
              letterSpacing: 2,
            }}
          >
            {activeFlows.length} CONNECTION{activeFlows.length !== 1 ? "S" : ""} · CLICK TO DESELECT
          </div>
        )}
      </div>

      {/* Layers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 960, margin: "0 auto" }}>
        {layers.map((layer) => (
          <div key={layer.id}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 4,
                color: layer.color,
                marginBottom: 8,
                paddingLeft: 4,
                opacity: 0.8,
              }}
            >
              ── {layer.label}
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "16px 20px",
                background: layer.bg,
                border: `1px solid ${layer.color}22`,
                borderLeft: `3px solid ${layer.color}`,
                borderRadius: 4,
                flexWrap: "wrap",
              }}
            >
              {layer.nodes.map((node) => {
                const isActive = active === node.id;
                const isConnected = connectedIds.has(node.id);
                const isDimmed = active && !isActive && !isConnected;
                const inbound = flows.filter((f) => f.to === node.id);
                const outbound = flows.filter((f) => f.from === node.id);

                return (
                  <div
                    key={node.id}
                    onClick={() => setActive(active === node.id ? null : node.id)}
                    style={{
                      flex: "1 1 160px",
                      minWidth: 140,
                      maxWidth: 220,
                      padding: "12px 16px",
                      background: isActive
                        ? `${layer.color}22`
                        : isConnected
                        ? `${layer.color}0f`
                        : "#0a0a12",
                      border: `1px solid ${isActive ? layer.color : isConnected ? layer.color + "66" : "#1a1a2a"}`,
                      borderRadius: 4,
                      cursor: "pointer",
                      opacity: isDimmed ? 0.25 : 1,
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: layer.color,
                          boxShadow: `0 0 8px ${layer.color}`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive ? layer.color : isConnected ? layer.color + "cc" : "#ccc",
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      {node.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#444", letterSpacing: 0.3 }}>
                      {node.sub}
                    </div>
                    {(inbound.length > 0 || outbound.length > 0) && (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {inbound.length > 0 && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              background: "#0a1a0a",
                              border: "1px solid #1a3a1a",
                              borderRadius: 2,
                              color: "#4ade80",
                              letterSpacing: 1,
                            }}
                          >
                            ↓ {inbound.length} IN
                          </span>
                        )}
                        {outbound.length > 0 && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              background: "#0a0a1a",
                              border: "1px solid #1a1a3a",
                              borderRadius: 2,
                              color: "#60a5fa",
                              letterSpacing: 1,
                            }}
                          >
                            ↑ {outbound.length} OUT
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {active &&
              activeFlows.filter(
                (f) =>
                  layer.nodes.some((n) => n.id === f.from) ||
                  layer.nodes.some((n) => n.id === f.to)
              ).length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    paddingLeft: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {activeFlows
                    .filter(
                      (f) =>
                        layer.nodes.some((n) => n.id === f.from) ||
                        layer.nodes.some((n) => n.id === f.to)
                    )
                    .map((f, i) => {
                      const isSource = layer.nodes.some((n) => n.id === f.from);
                      return (
                        <div
                          key={i}
                          style={{
                            fontSize: 10,
                            color: isSource ? "#60a5fa" : "#4ade80",
                            letterSpacing: 1,
                            background: isSource ? "#00061a" : "#000f06",
                            border: `1px solid ${isSource ? "#1a2a4a" : "#0a2a1a"}`,
                            padding: "3px 10px",
                            borderRadius: 2,
                          }}
                        >
                          {f.from} → {f.to}{" "}
                          <span style={{ color: "#555" }}>· {f.label}</span>
                        </div>
                      );
                    })}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Flow legend */}
      <div
        style={{
          maxWidth: 960,
          margin: "32px auto 0",
          padding: "16px 20px",
          background: "#0a0a12",
          border: "1px solid #1a1a2a",
          borderRadius: 4,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#333" }}>DATA FLOW</div>
        {[
          { color: "#7C3AED", label: "External APIs → Backend" },
          { color: "#DC2626", label: "Backend → ML Models" },
          { color: "#DB2777", label: "ML → LLM Layer" },
          { color: "#F5D000", label: "LLM → API → Frontend" },
          { color: "#0EA5E9", label: "Frontend → Deployment" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 2,
                background: item.color,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -1,
                  top: -3,
                  fontSize: 8,
                  color: item.color,
                }}
              >
                ▶
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: 0.5 }}>
              {item.label}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#333", letterSpacing: 1 }}>
          CLICK ANY NODE TO TRACE CONNECTIONS
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "#222", letterSpacing: 3 }}>
        SHWAAS · INDIA INNOVATES 2026 · CIVIC TECH HACKATHON
      </div>
    </div>
  );
}
