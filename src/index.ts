import { Hono } from "hono";
import { getTranscribedWord, isWordInList } from "./utils/helpers";
import { cors } from "hono/cors";
import { HonoVariables } from "./utils/types";
import { logger } from "hono/logger";
import { sessionMiddleware } from "./middleware/session";
import list from "./controllers/list";
import auth from "./controllers/auth";

const app = new Hono<{ Variables: HonoVariables }>();

// Middleware
app.use(logger());
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("*", sessionMiddleware);

app.route("/", auth);
app.route("/repeat-list", list);
app.get("/:word?", async (c) => {
  const session = c.get("session");
  let wordIsInList = false;

  const { word } = c.req.param();
  let transcribed = await getTranscribedWord(word);

  // Fetches a different word in case of a blank transcription
  let refetchLimiter = 0;
  while (transcribed.array.length === 0 && refetchLimiter < 5) {
    transcribed = await getTranscribedWord();
    refetchLimiter++;
  }

  if (session) {
    wordIsInList = await isWordInList(transcribed.word, session);
  }

  return c.json({
    loggedIn: session !== null,
    wordIsInList: wordIsInList,
    originalWord: transcribed.word,
    transcriptions: transcribed.array,
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
