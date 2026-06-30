export const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg"] as const;

export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

export type AssetSport = "f1" | "motogp";
