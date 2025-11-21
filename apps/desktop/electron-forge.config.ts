import type { ForgeConfig } from "@electron-forge/shared-types";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";

const config: ForgeConfig = {
  packagerConfig: {
    name: "BytePad Studio",
    executableName: "bytepad-studio",
    asar: true,
    // Icon paths (create these files or remove icon config)
    // icon: "./assets/icon.png", // Windows/Linux
    // icon: "./assets/icon.icns", // macOS
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "bytepad-studio",
    }),
    new MakerZIP({}, ["darwin", "linux"]),
    new MakerDeb({
      options: {
        maintainer: "BytePad Team",
        homepage: "https://bytepad.app",
      },
    }),
    new MakerRpm({
      options: {
        maintainer: "BytePad Team",
        homepage: "https://bytepad.app",
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: "src/main/index.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/preload/index.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
  ],
};

export default config;

