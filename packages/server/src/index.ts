import { createLogger } from "@chat-x/shared";
import { createApp } from "./app.js";

const logger = createLogger("server");
const PORT = parseInt(process.env.PORT || "3000", 10);

const app = createApp();

app.listen(PORT, () => {
  logger.log(`Server running on http://localhost:${PORT}`);
});
