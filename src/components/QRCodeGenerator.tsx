"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "qrcode";

type QRType = "url" | "text" | "wifi" | "vcard";

interface WiFiConfig {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
}

interface VCardConfig {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  url: string;
}

interface QRSettings {
  type: QRType;
  content: string;
  foreground: string;
  background: string;
  frameText: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  size: number;
}

const defaultWiFi: WiFiConfig = {
  ssid: "",
  password: "",
  encryption: "WPA",
};

const defaultVCard: VCardConfig = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  organization: "",
  url: "",
};

const QR_TYPES: { value: QRType; label: string; icon: string }[] = [
  { value: "url", label: "URL", icon: "🌐" },
  { value: "text", label: "Text", icon: "📝" },
  { value: "wifi", label: "WiFi", icon: "📶" },
  { value: "vcard", label: "vCard", icon: "👤" },
];

const PRESET_COLORS = [
  { fg: "#000000", bg: "#FFFFFF", label: "Classic" },
  { fg: "#1a1a2e", bg: "#e8f4f8", label: "Ocean" },
  { fg: "#6C63FF", bg: "#F8F9FF", label: "Indigo" },
  { fg: "#FF6B6B", bg: "#FFF5F5", label: "Coral" },
  { fg: "#2ECC71", bg: "#F0FFF4", label: "Emerald" },
  { fg: "#E056A0", bg: "#FFF0F7", label: "Pink" },
  { fg: "#00B4D8", bg: "#F0FBFF", label: "Cyan" },
  { fg: "#F4A261", bg: "#FFFBF0", label: "Amber" },
  { fg: "#7C3AED", bg: "#F5F3FF", label: "Violet" },
  { fg: "#FFFFFF", bg: "#000000", label: "Inverted" },
];

function buildWiFiString(config: WiFiConfig): string {
  const enc = config.encryption === "nopass" ? "" : config.encryption;
  return `WIFI:T:${enc};S:${config.ssid};P:${config.password};;`;
}

function buildVCardString(config: VCardConfig): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${config.lastName};${config.firstName};;;`,
    `FN:${config.firstName} ${config.lastName}`,
    config.organization ? `ORG:${config.organization}` : "",
    config.phone ? `TEL:${config.phone}` : "",
    config.email ? `EMAIL:${config.email}` : "",
    config.url ? `URL:${config.url}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function getQRContent(type: QRType, content: string, wifi: WiFiConfig, vcard: VCardConfig): string {
  switch (type) {
    case "url":
      return content.startsWith("http") ? content : `https://${content}`;
    case "text":
      return content;
    case "wifi":
      return buildWiFiString(wifi);
    case "vcard":
      return buildVCardString(vcard);
    default:
      return content;
  }
}

export default function QRCodeGenerator() {
  const [settings, setSettings] = useState<QRSettings>({
    type: "url",
    content: "",
    foreground: "#000000",
    background: "#FFFFFF",
    frameText: "",
    errorCorrectionLevel: "M",
    size: 300,
  });

  const [wifi, setWiFi] = useState<WiFiConfig>(defaultWiFi);
  const [vcard, setVCard] = useState<VCardConfig>(defaultVCard);
  const [showPresets, setShowPresets] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const generateQR = useCallback(async () => {
    const qrContent = getQRContent(settings.type, settings.content, wifi, vcard);
    if (!qrContent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await QRCode.toCanvas(canvas, qrContent, {
        width: settings.size,
        margin: 2,
        color: {
          dark: settings.foreground,
          light: settings.background,
        },
        errorCorrectionLevel: settings.errorCorrectionLevel,
      });
    } catch {
      // QR generation error - content may be too long
    }
  }, [settings, wifi, vcard]);

  const generateSVG = useCallback(async () => {
    const qrContent = getQRContent(settings.type, settings.content, wifi, vcard);
    if (!qrContent) return "";

    try {
      const svg = await QRCode.toString(qrContent, {
        type: "svg",
        width: settings.size,
        margin: 2,
        color: {
          dark: settings.foreground,
          light: settings.background,
        },
        errorCorrectionLevel: settings.errorCorrectionLevel,
      });
      return svg;
    } catch {
      return "";
    }
  }, [settings, wifi, vcard]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const exportSVG = useCallback(async () => {
    const svg = await generateSVG();
    if (!svg) return;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [generateSVG]);

  const hasContent =
    (settings.type === "url" || settings.type === "text" ? settings.content : "") ||
    (settings.type === "wifi" ? wifi.ssid : "") ||
    (settings.type === "vcard" ? vcard.firstName : "");

  const renderTypeFields = () => {
    switch (settings.type) {
      case "url":
        return (
          <div>
            <label className="label-glass block mb-1.5">URL</label>
            <input
              type="url"
              className="input-glass w-full px-4 py-3 text-sm"
              placeholder="https://example.com"
              value={settings.content}
              onChange={(e) => setSettings((s) => ({ ...s, content: e.target.value }))}
            />
          </div>
        );
      case "text":
        return (
          <div>
            <label className="label-glass block mb-1.5">Text Content</label>
            <textarea
              className="input-glass w-full px-4 py-3 text-sm min-h-[100px] resize-y"
              placeholder="Enter your text here..."
              value={settings.content}
              onChange={(e) => setSettings((s) => ({ ...s, content: e.target.value }))}
            />
          </div>
        );
      case "wifi":
        return (
          <div className="space-y-3">
            <div>
              <label className="label-glass block mb-1.5">Network Name (SSID)</label>
              <input
                type="text"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="MyWiFiNetwork"
                value={wifi.ssid}
                onChange={(e) => setWiFi((w) => ({ ...w, ssid: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-glass block mb-1.5">Password</label>
              <input
                type="text"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="password123"
                value={wifi.password}
                onChange={(e) => setWiFi((w) => ({ ...w, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-glass block mb-1.5">Encryption</label>
              <div className="flex gap-2">
                {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                  <button
                    key={enc}
                    onClick={() => setWiFi((w) => ({ ...w, encryption: enc }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${
                      wifi.encryption === enc
                        ? "tab-active"
                        : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {enc === "nopass" ? "None" : enc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "vcard":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-glass block mb-1.5">First Name</label>
                <input
                  type="text"
                  className="input-glass w-full px-4 py-3 text-sm"
                  placeholder="John"
                  value={vcard.firstName}
                  onChange={(e) => setVCard((v) => ({ ...v, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-glass block mb-1.5">Last Name</label>
                <input
                  type="text"
                  className="input-glass w-full px-4 py-3 text-sm"
                  placeholder="Doe"
                  value={vcard.lastName}
                  onChange={(e) => setVCard((v) => ({ ...v, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label-glass block mb-1.5">Phone</label>
              <input
                type="tel"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="+1 234 567 890"
                value={vcard.phone}
                onChange={(e) => setVCard((v) => ({ ...v, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-glass block mb-1.5">Email</label>
              <input
                type="email"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="john@example.com"
                value={vcard.email}
                onChange={(e) => setVCard((v) => ({ ...v, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-glass block mb-1.5">Organization</label>
              <input
                type="text"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="Company Name"
                value={vcard.organization}
                onChange={(e) => setVCard((v) => ({ ...v, organization: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-glass block mb-1.5">Website</label>
              <input
                type="url"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="https://example.com"
                value={vcard.url}
                onChange={(e) => setVCard((v) => ({ ...v, url: e.target.value }))}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-3 tracking-tight">
            QR Code Generator
          </h1>
          <p className="text-white/40 text-base md:text-lg max-w-lg mx-auto">
            Create beautiful, custom QR codes instantly. Change colors, add frames, and export in high quality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel - Controls */}
          <div className="glass-card p-6 md:p-8 space-y-6">
            {/* QR Type Selector */}
            <div>
              <label className="label-glass block mb-2.5">QR Code Type</label>
              <div className="grid grid-cols-4 gap-2">
                {QR_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSettings((s) => ({ ...s, type: t.value, content: "" }))}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium border transition-all duration-300 ${
                      settings.type === t.value
                        ? "tab-active"
                        : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type-specific Fields */}
            <div>{renderTypeFields()}</div>

            {/* Color Settings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label-glass">Colors</label>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors"
                >
                  {showPresets ? "Hide Presets" : "Show Presets"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label-glass block mb-1.5 text-[0.7rem]">Foreground</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      className="color-swatch"
                      value={settings.foreground}
                      onChange={(e) => setSettings((s) => ({ ...s, foreground: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="input-glass flex-1 bg-transparent border-0 text-xs px-1 py-1.5 focus:ring-0 focus:shadow-none focus:border-0"
                      value={settings.foreground}
                      onChange={(e) => setSettings((s) => ({ ...s, foreground: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-glass block mb-1.5 text-[0.7rem]">Background</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      className="color-swatch"
                      value={settings.background}
                      onChange={(e) => setSettings((s) => ({ ...s, background: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="input-glass flex-1 bg-transparent border-0 text-xs px-1 py-1.5 focus:ring-0 focus:shadow-none focus:border-0"
                      value={settings.background}
                      onChange={(e) => setSettings((s) => ({ ...s, background: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {showPresets && (
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          foreground: preset.fg,
                          background: preset.bg,
                        }))
                      }
                      className="group flex flex-col items-center gap-1"
                      title={preset.label}
                    >
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-white/10 group-hover:border-white/30 transition-all flex items-center justify-center"
                        style={{ background: preset.bg }}
                      >
                        <div className="w-4 h-4 rounded" style={{ background: preset.fg }} />
                      </div>
                      <span className="text-[0.6rem] text-white/30 group-hover:text-white/60 transition-colors">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Frame Text */}
            <div>
              <label className="label-glass block mb-1.5">Frame Text (optional)</label>
              <input
                type="text"
                className="input-glass w-full px-4 py-3 text-sm"
                placeholder="Scan me!"
                value={settings.frameText}
                onChange={(e) => setSettings((s) => ({ ...s, frameText: e.target.value }))}
              />
            </div>

            {/* Error Correction Level */}
            <div>
              <label className="label-glass block mb-2.5">Error Correction</label>
              <div className="flex gap-2">
                {(["L", "M", "Q", "H"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSettings((s) => ({ ...s, errorCorrectionLevel: level }))}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${
                      settings.errorCorrectionLevel === level
                        ? "tab-active"
                        : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {level}
                    <span className="block text-[0.6rem] opacity-50 mt-0.5">
                      {level === "L" ? "7%" : level === "M" ? "15%" : level === "Q" ? "25%" : "30%"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <label className="label-glass block mb-2.5">
                Size: {settings.size}px
              </label>
              <input
                type="range"
                min="150"
                max="600"
                step="10"
                value={settings.size}
                onChange={(e) => setSettings((s) => ({ ...s, size: Number(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gradient-to-r
                  [&::-webkit-slider-thumb]:from-indigo-500
                  [&::-webkit-slider-thumb]:to-purple-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-indigo-500/30"
              />
            </div>
          </div>

          {/* Right Panel - Preview & Export */}
          <div className="glass-card p-6 md:p-8 flex flex-col">
            <label className="label-glass block mb-4">Preview</label>

            {/* QR Code Preview */}
            <div
              className={`qr-preview-area flex-1 ${hasContent ? "has-qr" : ""} overflow-hidden`}
            >
              {hasContent ? (
                <div className="relative inline-flex flex-col items-center">
                  {settings.frameText && (
                    <div
                      className="text-xs font-bold tracking-widest uppercase mb-3 px-4 py-1.5 rounded-full"
                      style={{
                        color: settings.foreground,
                        background: `${settings.background}ee`,
                      }}
                    >
                      {settings.frameText}
                    </div>
                  )}
                  <div
                    className="rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: settings.background }}
                  >
                    <canvas ref={canvasRef} />
                  </div>
                  {settings.frameText && (
                    <div
                      className="w-full h-2 rounded-b-xl"
                      style={{ background: settings.foreground }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center px-4">
                  <div className="text-5xl mb-3 opacity-30">📱</div>
                  <p className="text-white/25 text-sm">
                    Select a type and enter content to generate your QR code
                  </p>
                </div>
              )}
            </div>

            {/* SVG Preview (hidden, for export) */}
            <div ref={svgContainerRef} className="hidden" />

            {/* Export Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={exportPNG}
                disabled={!hasContent}
                className={`export-btn flex-1 justify-center ${
                  !hasContent ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export PNG
              </button>
              <button
                onClick={exportSVG}
                disabled={!hasContent}
                className={`export-btn flex-1 justify-center ${
                  !hasContent ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export SVG
              </button>
            </div>

            {/* Color Quick Swap */}
            <button
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  foreground: s.background,
                  background: s.foreground,
                }))
              }
              className="export-btn w-full justify-center mt-3 text-xs"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              Swap Colors
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 md:mt-12 pb-8">
          <p className="text-white/20 text-xs">
            Built with Next.js &amp; qrcode.js
          </p>
        </div>
      </div>
    </div>
  );
}
