import { expect, test } from "bun:test";
import { getTranscribedWord } from "../../src/utils/helpers";

test("Transcription of 'dog' returns the correct object", async () => {
  const rtrn = await getTranscribedWord("dog");
  expect(rtrn).toContainAllKeys(["array", "word"]);
});

test("Transcription of a random word returns the correct object", async () => {
  const rtrn = await getTranscribedWord("dog");
  expect(rtrn).toContainAllKeys(["array", "word"]);
});

test("Transcription of 'dog' is correctly filtered", async () => {
  const rtrn = await getTranscribedWord("dog");
  rtrn.array.forEach((val) => {
    expect(val).not.toContain("/");
    expect(val).not.toContain("-");
    expect(val).not.toContain(".");
  });
});

test("Transcription of a random word is correctly filtered", async () => {
  const rtrn = await getTranscribedWord();
  rtrn.array.forEach((val) => {
    expect(val).not.toContain("/");
    expect(val).not.toContain("-");
    expect(val).not.toContain(".");
  });
});
