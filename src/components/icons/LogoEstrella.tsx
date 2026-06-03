interface Props {
  className?: string;
}

export function LogoEstrella({ className }: Props) {
  return (
    <span className={`inline-flex flex-col items-start select-none leading-none ${className}`}>
      <span
        style={{
          fontFamily: "var(--font-lobster, cursive)",
          color: "#2a8a1a",
          fontSize: "1.75rem",
          lineHeight: 1,
        }}
      >
        Estrella
      </span>
      <span
        style={{
          background: "#c41e1e",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: "bold",
          fontSize: "0.55rem",
          letterSpacing: "0.2em",
          padding: "2px 6px",
          alignSelf: "flex-end",
          marginTop: "1px",
          borderRadius: "2px",
        }}
      >
        TOUR
      </span>
    </span>
  );
}
