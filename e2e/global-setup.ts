import { createServer } from "vite";

export default async function globalSetup() {
  const port = Number(process.env.PLAYWRIGHT_PORT ?? 4174);
  const server = await createServer({
    configFile: "vite.config.ts",
    server: { host: "127.0.0.1", port, strictPort: true },
  });
  await server.listen();

  return async () => {
    await server.close();
  };
}
