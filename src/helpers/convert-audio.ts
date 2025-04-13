import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";

const unlinkAsync = promisify(fs.unlink);

export const convertM4ABase64ToWavBase64 = async (
  m4aBase64: string
): Promise<string> => {
  const timestamp = Date.now();
  const tmpDir = path.join(__dirname, "../../../tmp");

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const inputPath = path.join(tmpDir, `audio-${timestamp}.m4a`);
  const outputPath = inputPath.replace(".m4a", ".wav");

  // Write m4a to disk
  fs.writeFileSync(inputPath, new Uint8Array(Buffer.from(m4aBase64, "base64")));

  // Convert to wav
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("wav")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });

  // Read .wav as base64
  const wavBuffer = fs.readFileSync(outputPath);
  const wavBase64 = wavBuffer.toString("base64");

  // Clean up
  await Promise.all([
    unlinkAsync(inputPath).catch(() => {}),
    unlinkAsync(outputPath).catch(() => {}),
  ]);

  return wavBase64;
};
