import localFont from "next/font/local";

export const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/SpaceGrotesk-Regular.ttf", weight: "400" },
    { path: "./fonts/SpaceGrotesk-Bold.ttf", weight: "700" },
  ],
  variable: "--font-space-grotesk",
});
