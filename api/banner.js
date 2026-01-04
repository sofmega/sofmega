// api/banner.js (ESM default export)

function clamp(n, min, max) {
  n = Number(n);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Escape text so SVG/XML never breaks (fixes StartTag invalid element name)
function escapeXml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}

// Deterministic RNG (so same seed = same banner)
function makeRng(seed) {
  let x = (seed >>> 0) || 1;
  return () => {
    // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}

function matrixBanner({ W, H, cols, speed, seed }) {
  const rand = makeRng(seed);

  // Safer charset (no < > &). Escaping still protects you anyway.
  const charset = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%*+-/=";

  const colWidth = W / cols;

  // Build rain columns
  let columnsSvg = "";
  for (let i = 0; i < cols; i++) {
    const x = Math.round(i * colWidth + colWidth * 0.5);

    // random stream length + font size
    const fontSize = clamp(Math.round(10 + rand() * 10), 10, 20);
    const streamChars = clamp(Math.round(18 + rand() * 30), 18, 60);

    // random y start (negative so it "falls in")
    const yStart = -Math.round(rand() * H * 1.2);
    const dur = (speed * (0.7 + rand() * 0.9)).toFixed(2); // vary per column
    const opacity = (0.25 + rand() * 0.35).toFixed(2);

    // build text string with line breaks (we'll split into <tspan>s)
    let s = "";
    for (let k = 0; k < streamChars; k++) {
      s += charset[Math.floor(rand() * charset.length)];
      if (k !== streamChars - 1) s += "\n";
    }

    // bright "head" glow (small circle) + stream text
    const headY = yStart + Math.round(rand() * H * 0.6);

    const tspans = s.split("\n").map((ch, idx) => {
      const safe = escapeXml(ch);
      return `<tspan x="${x}" dy="${idx === 0 ? 0 : fontSize + 1}">${safe}</tspan>`;
    }).join("");

    columnsSvg += `
      <g opacity="${opacity}">
        <circle cx="${x}" cy="${headY}" r="${Math.max(2, Math.round(fontSize / 3))}" fill="rgba(120,255,160,0.85)">
          <animate attributeName="cy" dur="${dur}s" repeatCount="indefinite" from="${yStart}" to="${H + 40}" />
          <animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" values="0;0.9;0.3;0" />
        </circle>

        <text x="${x}" y="${yStart}" text-anchor="middle"
              font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              font-size="${fontSize}"
              fill="rgba(80, 255, 140, 0.85)"
              xml:space="preserve">
          ${tspans}
          <animate attributeName="y" dur="${dur}s" repeatCount="indefinite" from="${yStart}" to="${H + 60}" />
        </text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Matrix banner">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="55%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>

    <!-- Green glow -->
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Scanlines -->
    <pattern id="scan" width="1" height="4" patternUnits="userSpaceOnUse">
      <rect width="1" height="1" fill="rgba(255,255,255,0.06)"/>
      <rect y="1" width="1" height="3" fill="rgba(0,0,0,0)"/>
    </pattern>

    <clipPath id="clip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="12"/>
    </clipPath>

    <style><![CDATA[
      @media (prefers-reduced-motion: reduce) {
        animate { display: none !important; }
      }
    ]]></style>
  </defs>

  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)"/>

  <g clip-path="url(#clip)" filter="url(#glow)">
    <!-- subtle green fog -->
    <rect width="${W}" height="${H}" fill="rgba(0,255,120,0.06)"/>

    ${columnsSvg}
  </g>

  <!-- scanlines overlay -->
  <rect width="${W}" height="${H}" fill="url(#scan)" opacity="0.35"/>

  <!-- vignette -->
  <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.25)"/>
</svg>`;
}

function waveBanner({ W, H }) {
  // Your current wave banner (short + simple)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gradient banner">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5b2a86"/>
      <stop offset="55%" stop-color="#a33a6f"/>
      <stop offset="100%" stop-color="#b11b2a"/>
    </linearGradient>
    <clipPath id="clip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="10"/>
    </clipPath>
  </defs>

  <rect width="${W}" height="${H}" rx="10" fill="url(#grad)"/>
  <g clip-path="url(#clip)">
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.14)"/>
    <path fill="rgba(0,0,0,0.38)"
      d="M0,${Math.round(H*0.7)}
         C120,${Math.round(H*0.5)} 240,${Math.round(H*0.9)} 360,${Math.round(H*0.7)}
         C480,${Math.round(H*0.5)} 600,${Math.round(H*0.9)} 720,${Math.round(H*0.7)}
         C840,${Math.round(H*0.5)} 960,${Math.round(H*0.9)} 1080,${Math.round(H*0.7)}
         C1200,${Math.round(H*0.5)} 1320,${Math.round(H*0.9)} ${W},${Math.round(H*0.7)}
         L${W},${H} L0,${H} Z"/>
    <path fill="rgba(255,255,255,0.11)"
      d="M0,${Math.round(H*0.42)}
         C140,${Math.round(H*0.2)} 280,${Math.round(H*0.55)} 420,${Math.round(H*0.38)}
         C560,${Math.round(H*0.2)} 700,${Math.round(H*0.6)} 840,${Math.round(H*0.4)}
         C980,${Math.round(H*0.2)} 1120,${Math.round(H*0.55)} 1260,${Math.round(H*0.38)}
         C1340,${Math.round(H*0.28)} 1380,${Math.round(H*0.3)} ${W},${Math.round(H*0.32)}
         L${W},0 L0,0 Z"/>
  </g>
</svg>`;
}

export default function handler(req, res) {
  const style = String(req.query?.style ?? "wave").toLowerCase();

  const W = 1400;
  const H = clamp(req.query?.h ?? (style === "matrix" ? 90 : 80), 60, 180);

  const svg =
    style === "matrix"
      ? matrixBanner({
          W,
          H,
          cols: clamp(req.query?.cols ?? 44, 18, 80),
          speed: clamp(req.query?.speed ?? 6, 2, 20),
          seed: clamp(req.query?.seed ?? 1337, 1, 999999999),
        })
      : waveBanner({ W, H });

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(svg);
}