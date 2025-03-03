import { expect, test } from "bun:test";
import app from "../src";

test("Getting a transcription of 'dog' returns the correct object", async () => {
  const rtrn = await app.request("/dog");
  const data = await rtrn.json();

  expect(rtrn.status).toBe(200);
  expect(data).toContainAllKeys([
    "originalWord",
    "transcriptions",
    "loggedIn",
    "wordIsInList",
  ]);

  expect(data.originalWord).toBe("dog");
  expect(data.transcriptions).toStrictEqual(["dɒɡ"]);
});

test("Getting a random word returns the correct object", async () => {
  const rtrn = await app.request("/");
  const data = await rtrn.json();

  expect(rtrn.status).toBe(200);
  expect(data).toContainAllKeys([
    "originalWord",
    "transcriptions",
    "loggedIn",
    "wordIsInList",
  ]);
});
