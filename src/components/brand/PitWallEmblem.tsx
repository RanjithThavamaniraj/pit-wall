import Image from "next/image";

const SIZES = {
  sm: { width: 70, height: 32 },
  md: { width: 70, height: 32 },
} as const;

type Props = {
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
};

export function PitWallEmblem({
  size = "md",
  className = "",
  priority = false,
}: Props) {
  const { width, height } = SIZES[size];

  return (
    <Image
      src="/brand/pitwall-p-mark.png"
      alt=""
      width={width}
      height={height}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
      aria-hidden="true"
    />
  );
}
