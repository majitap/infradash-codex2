import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
export const labels = {
  healthy: "정상",
  attention: "확인 필요",
  success: "성공",
  failed: "실패",
  running: "실행 중",
  online: "온라인",
  offline: "오프라인",
  paused: "일시중지",
  investigating: "조사 중",
  identified: "원인 확인",
  resolved: "해결됨",
  open: "미해결",
  critical: "치명적",
  high: "높음",
  medium: "보통",
  low: "낮음",
};
const colors = {
  healthy: "green",
  attention: "amber",
  success: "green",
  failed: "red",
  running: "blue",
  online: "green",
  offline: "muted",
  paused: "amber",
  investigating: "amber",
  identified: "blue",
  resolved: "green",
  open: "amber",
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "muted",
};
export function useLocal(key, initial, validate = () => true) {
  const [value, setValue] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(`infradash2-v1-${key}`));
      return value !== null && validate(value) ? value : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`infradash2-v1-${key}`, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}
export function Status({ value, children }) {
  return (
    <span className={`status ${colors[value] || "muted"}`}>
      <i />
      {children || labels[value] || value}
    </span>
  );
}
export function Avatar({ name }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name?.slice(-2)}
    </span>
  );
}
export function ButtonLink({ children = "모두 보기", onClick }) {
  return (
    <button className="button-link" onClick={onClick}>
      {children}
      <ArrowRight size={17} />
    </button>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="search-field">
      <Search size={19} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="검색 지우기" onClick={() => onChange("")}>
          <X size={17} />
        </button>
      )}
    </div>
  );
}
export function Tabs({ value, onChange, options, label }) {
  return (
    <div className="tabs" aria-label={label}>
      {options.map(([id, title]) => (
        <button
          key={id}
          aria-pressed={value === id}
          className={value === id ? "selected" : ""}
          onClick={() => onChange(id)}
        >
          {title}
        </button>
      ))}
    </div>
  );
}
export function Empty({
  title = "일치하는 항목이 없어요.",
  children = "검색어나 필터를 바꾸어 보세요.",
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Meter({ value }) {
  return (
    <div className="meter">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function Paginated({ rows, children, size = 6 }) {
  const [page, setPage] = useState(0),
    signature = rows.map((r) => r.id).join("|"),
    pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages - 1);
  useEffect(() => setPage(0), [signature]);
  return (
    <>
      {children(rows.slice(current * size, (current + 1) * size))}
      {rows.length > 0 && (
        <div className="pagination">
          <span>
            총 {rows.length}개 중 {current * size + 1}–
            {Math.min(rows.length, (current + 1) * size)}
          </span>
          <div>
            <button
              aria-label="이전 페이지"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={19} />
            </button>
            <span>
              {current + 1} / {pages}
            </span>
            <button
              aria-label="다음 페이지"
              disabled={current === pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export function Dialog({
  title,
  label,
  onClose,
  children,
  drawer = false,
  initialFocus,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement,
      prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const target = initialFocus
        ? ref.current?.querySelector(initialFocus)
        : ref.current?.querySelector("button,input");
      target?.focus();
    });
    const listener = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const targets = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),input,select,textarea,a[href],summary,[tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length);
        if (e.shiftKey && document.activeElement === targets[0]) {
          e.preventDefault();
          targets.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === targets.at(-1)) {
          e.preventDefault();
          targets[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", listener);
      opener?.focus?.();
    };
  }, []);
  return (
    <div
      className={`overlay ${drawer ? "drawer-overlay" : ""}`}
      onClick={onClose}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label || title}
        className={drawer ? "drawer" : "dialog"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <span>{title}</span>
          <button className="icon-button" aria-label="닫기" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
