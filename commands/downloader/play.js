const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  command: ["play", "mp3"],
  description: "Descarga música en MP3 desde YouTube",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");
      if (!query)
        return client.sendMessage(m.chat, { text: "❗ Escribe el título o URL del video" }, { quoted: m });

      await client.sendMessage(m.chat, { text: "🔍 Buscando..." }, { quoted: m });

      // ✅ Api
      const search = await axios.get(
        `https://ytsearch.yandexapi.xyz/search?q=${encodeURIComponent(query)}`
      );

      if (!search.data || !search.data.result || !search.data.result[0])
        return client.sendMessage(m.chat, { text: "⚠️ No encontré resultados." }, { quoted: m });

      const video = search.data.result[0];
      const url = video.url;

      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
      const file = `./tmp/${safeTitle}.mp3`;

      await client.sendMessage(
        m.chat,
        {
          image: { url: video.thumbnail },
          caption: `🎧 *${video.title}*\n⏱️ ${video.duration}\n⏬ *Descargando MP3...*`,
        },
        { quoted: m }
      );

      // ✅ ffmpeg
      ffmpeg(ytdl(url, { filter: "audioonly", quality: "highestaudio" }))
        .setFfmpegPath(ffmpegPath)
        .audioBitrate(128)
        .save(file)
        .on("end", async () => {
          await client.sendMessage(
            m.chat,
            {
              audio: { url: file },
              mimetype: "audio/mpeg",
              fileName: `${safeTitle}.mp3`,
            },
            { quoted: m }
          );
          setTimeout(() => fs.unlinkSync(file), 2000);
        })
        .on("error", async (err) => {
          await global.sendError(client, m, err);
        });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
