export function Icon({ name, style, className = '' }) {
  return <i className={`ph ph-${name} ${className}`} style={style} aria-hidden="true" />;
}

export function Tag({ tone, children, className = '' }) {
  return (
    <span className={`tag ${className}`} style={{ background: tone.bg, color: tone.fg, borderColor: tone.bd }}>
      {children}
    </span>
  );
}

export function SectionHead({ title, hindi, showHindi }) {
  return (
    <div className="section-head">
      <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
      {showHindi && <div className="note">{hindi}</div>}
    </div>
  );
}
