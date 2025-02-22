import { google } from "googleapis";
import { triggerEvent } from "./star-message-service";

const createYoutubeService = () => {
  return google.youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });
};

const searchMusic = async (query: string, userId: string, source: string) => {
  const youtube = createYoutubeService();
  const response = await youtube.search.list({
    part: ["snippet"],
    q: query,
    type: ["video"],
  });

  await triggerEvent(
    "playMusic",
    response.data.items?.[0] || null,
    userId,
    source
  );

  return response.data.items;
};

export { searchMusic };
