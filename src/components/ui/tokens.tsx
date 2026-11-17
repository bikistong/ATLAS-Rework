/**
 * UIUX_STYLING_SUMMARY.md — Design Tokens "Neutral Slate Enterprise"
 * Shared primitives agar seluruh Modul A/B/C konsisten:
 * Card + header strip uppercase, Badge status semantik, Banner gate,
 * Field label+input, Segmented Ya/Tidak/N-A, Sign-off footer 3 kolom.
 */
import React from "react";

/* ---------- Status semantik (WAJIB konsisten) ---------- */
export type WorkpaperStatus =
  | "kosong"
  | "draft"
  | "prepared"
  | "reviewed"
  | "locked"
  | "alert"
  | "ok";

export const STATUS_STYLE: Record<WorkpaperStatus, string> = {
  kosong: "bg-slate-200 text-slate-600",
  draft: "bg-amber-100 text-amber-800",
  prepared: "bg-blue-100 text-blue-800",
  reviewed: "bg-sky-100 text-sky-800",
  locked: "bg-emerald-100 text-emerald-800",
  alert: "bg-rose-100 text-rose-800",
  ok: "bg-emerald-100 text-emerald-800",
};

export const STATUS_LABEL: Record<WorkpaperStatus, string> = {
  kosong: "KOSONG",
  draft: "DRAFT",
  prepared: "PREPARED",
  reviewed: "REVIEWED",
  locked: "PARTNER LOCKED",
  alert: "OPEN",
  ok: "CLEAR",
};

/* ---------- Badge pill ---------- */
export function Badge({
  status,
  label,
  className = "",
}: {
  status: WorkpaperStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center h-[18px] px-1.5 rounded-sm ${STATUS_STYLE[status]} text-[9px] font-bold uppercase tracking-wider leading-none ${className}`}
    >
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

/* ---------- Card dengan header strip uppercase ---------- */
export function Card({
  title,
  icon,
  actions,
  children,
  className = "",
  bodyClassName = "p-3",
}: {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="h-8 px-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 min-w-0 truncate">
            {title}
          </span>
          {actions && <span className="ml-auto flex items-center gap-1.5">{actions}</span>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/* ---------- Banner Gate (amber = diblokir, emerald = lolos) ---------- */
export function GateBanner({
  variant,
  icon,
  children,
}: {
  variant: "warning" | "ok";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    variant === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-emerald-50 border-emerald-200 text-emerald-900";
  const iconCls = variant === "warning" ? "text-amber-600" : "text-emerald-600";
  return (
    <div className={`border ${cls} px-3 py-2 flex items-start gap-2.5 rounded-sm`}>
      <span className={`shrink-0 mt-0.5 ${iconCls}`}>{icon}</span>
      <p className="text-[11.5px] leading-relaxed">{children}</p>
    </div>
  );
}

/* ---------- Form field: label uppercase 11px + input h-8 ---------- */
export function Field({
  label,
  children,
  error,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      {children}
      {error ? (
        <div className="mt-0.5 text-[11px] text-rose-700">{error}</div>
      ) : hint ? (
        <div className="mt-0.5 text-[11px] italic text-slate-400">{hint}</div>
      ) : null}
    </div>
  );
}

export const inputCls =
  "h-8 w-full px-2 rounded border border-slate-300 bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed read-only:bg-slate-100 read-only:cursor-not-allowed";

export const inputErrorCls =
  "h-8 w-full px-2 rounded border border-rose-400 bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30";

export const monoNumCls =
  "h-8 w-full px-2 rounded border border-slate-300 bg-white text-[13px] font-mono tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";

/* ---------- Tombol ---------- */
export const btnPrimary =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed";

export const btnSecondary =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

export const btnDanger =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors";

export const btnSmall =
  "inline-flex items-center gap-1 h-6 px-2 rounded-sm bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-[10px] font-semibold transition-colors";

/* ---------- Segmented Ya / Tidak / N-A ---------- */
export type TriAnswer = "Ya" | "Tidak" | "N/A";

export function TriSegment({
  value,
  onChange,
  disabled = false,
}: {
  value?: TriAnswer;
  onChange?: (v: TriAnswer) => void;
  disabled?: boolean;
}) {
  const opts: { v: TriAnswer; active: string }[] = [
    { v: "Ya", active: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { v: "Tidak", active: "bg-rose-100 text-rose-800 border-rose-300" },
    { v: "N/A", active: "bg-slate-200 text-slate-700 border-slate-300" },
  ];
  return (
    <div className="inline-flex rounded-sm overflow-hidden border border-slate-300 bg-white divide-x divide-slate-200">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(o.v)}
          className={`h-6 px-2 text-[10px] font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed ${
            value === o.v ? o.active : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          {o.v}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabel: header & baris TOTAL ---------- */
export const thCls =
  "px-2 py-1.5 text-left text-[9px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border-b border-slate-200 whitespace-nowrap";

export const tdCls = "px-2 py-1 text-[11.5px] text-slate-800 align-middle";

export const tdMonoRight = `${tdCls} font-mono tabular-nums text-right`;

export const totalRowCls =
  "bg-slate-100 font-bold border-t-2 border-slate-400 text-[11.5px]";

/* ---------- Format angka ala akuntan ---------- */
export function fmtIdr(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n).toLocaleString("id-ID");
  return n < 0 ? `(${abs})` : abs;
}

export function NumCell({ value }: { value?: number | null }) {
  const neg = value != null && value < 0;
  return (
    <td className={`${tdMonoRight} ${neg ? "text-rose-700" : ""}`}>
      {fmtIdr(value)}
    </td>
  );
}

/* ---------- Sign-off footer 3 kolom ---------- */
export interface SignOffEntry {
  role: string;
  name: string;
  title: string;
  date?: string;
  status: WorkpaperStatus;
}

export function AvatarInitials({ initials }: { initials: string }) {
  return (
    <span className="h-8 w-8 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  );
}

export function SignOffFooter({ entries }: { entries: SignOffEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {entries.map((e) => (
        <div
          key={e.role}
          className="bg-white border border-slate-200 rounded-sm p-3 flex items-center gap-2.5"
        >
          <AvatarInitials
            initials={e.name
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          />
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {e.role}
            </div>
            <div className="text-[12px] font-semibold text-slate-800 truncate">
              {e.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{e.title}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge status={e.status} />
              {e.date && (
                <span className="font-mono text-[9px] text-slate-400">{e.date}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- KPI card ---------- */
export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "alert" | "ok";
}) {
  const valCls =
    tone === "alert" ? "text-rose-700" : tone === "ok" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
        {label}
      </div>
      <div className={`mt-1 font-mono tabular-nums text-[17px] font-semibold ${valCls}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}
