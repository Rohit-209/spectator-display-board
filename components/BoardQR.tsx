"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function BoardQR() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [href, setHref] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.origin}/m?src=qr`;
    setHref(url);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 220,
      color: { dark: "#0b1220", light: "#f8fafc" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, []);

  return (
    <a
      href={href}
      className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-100 text-slate-900 rounded-xl p-2 shadow-lg hover:scale-[1.02] transition"
      aria-label="Open companion phone view"
    >
      {dataUrl && (
        <img
          src={dataUrl}
          alt="Companion QR code"
          width={64}
          height={64}
          className="rounded"
        />
      )}
      <div className="text-[10px] uppercase tracking-widest leading-tight pr-2">
        scan for
        <br />
        detailed stats
      </div>
    </a>
  );
}
