import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
};

export function PitWallHeroLogo({
  className = "",
  priority = true,
}: Props) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      <Image
        src="/brand/pitwall-p-mark.png"
        alt=""
        width={112}
        height={51}
        priority={priority}
        className="h-10 w-auto shrink-0 sm:h-12"
        aria-hidden="true"
      />
      <p className="font-brand text-2xl font-bold leading-none tracking-tight sm:text-3xl">
        <span className="text-[#F0B429]">PitWall</span>{" "}
        <span className="text-white">Apex</span>
      </p>
    </div>
  );
}
