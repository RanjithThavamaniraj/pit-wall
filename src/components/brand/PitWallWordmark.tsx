type Props = {
  className?: string;
  textClassName?: string;
};

export function PitWallWordmark({
  className = "",
  textClassName = "text-base",
}: Props) {
  return (
    <span
      className={`font-brand font-bold tracking-tight ${textClassName} ${className}`}
    >
      <span className="text-[#F0B429]">PitWall</span>{" "}
      <span className="text-white">Apex</span>
    </span>
  );
}
