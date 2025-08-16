import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs/promises";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const toWav16kMono = async (srcPath: string) => {
  const outPath = path.join(
    path.dirname(srcPath),
    `${path.parse(srcPath).name}.wav`
  );
  await new Promise<void>((resolve, reject) => {
    ffmpeg(srcPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outPath);
  });
  const b64 = (await fs.readFile(outPath)).toString("base64");

  return { outPath, base64: b64, format: "wav" as const };
};

export const toMp3 = async (srcPath: string) => {
  const outPath = path.join(
    path.dirname(srcPath),
    `${path.parse(srcPath).name}.mp3`
  );
  await new Promise<void>((resolve, reject) => {
    ffmpeg(srcPath)
      .audioChannels(1) // optional but nice
      .audioFrequency(16000) // optional but STT-friendly
      .format("mp3")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outPath);
  });
  const b64 = (await fs.readFile(outPath)).toString("base64");

  return { outPath, base64: b64, format: "mp3" as const };
};
