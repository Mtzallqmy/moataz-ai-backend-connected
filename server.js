import next from "next";
import { apiApp } from "./server/src/index.js";
import { config } from "./server/src/config.js";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: process.cwd() });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

// All API routes are registered by the Express backend. Anything not handled
// by /api or /v1 falls through to the Next.js dashboard UI.
apiApp.all("*", (req, res) => handle(req, res));

apiApp.listen(config.port, () => {
  console.log(`Moataz AI fullstack Railway app listening on port ${config.port}`);
});
