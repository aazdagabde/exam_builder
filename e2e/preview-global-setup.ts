import { preview } from "vite";

export default async function previewGlobalSetup() {
  const port = Number(process.env.PLAYWRIGHT_PREVIEW_PORT ?? 4175);
  const server = await preview({
    configFile: "vite.config.ts",
    preview: { host: "127.0.0.1", port, strictPort: true },
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.httpServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  };
}
