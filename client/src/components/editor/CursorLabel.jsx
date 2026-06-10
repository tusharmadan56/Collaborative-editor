export default function CursorLabel({ name, color }) {
  return (
    <span
      className="cursor-label"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
