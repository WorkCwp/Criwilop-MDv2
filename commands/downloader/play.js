const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
const { exec } = require("child_process");

module.exports = {
  command: ["play", "mp3", "ytmp3"],
  description: "Descarga música en MP3",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");
      if (!query)
        return client.sendMessage(
          m.chat,
          { text: "❗ *Escribe nombre o link*\nEjemplo: `play Bad Bunny`" },
          { quoted: m }
        );

      let videoUrl = query;
      if (!query.startsWith("http")) {
        const s = await yts(query);
        if (!s.videos.length)
          return m.reply("⚠️ No encontré resultados.");
        videoUrl = s.videos[0].url;
      }

      const api = await axios.get(
        `https://delirius-apiofc.vercel.app/download/ytmp3?url=${videoUrl}`
      );

      const data = api.data?.data;
      if (!data || !data.download?.url)
        return m.reply("❌ Error generando el MP3");

      const fileName = data.download.filename.replace(/[^\w\s.-]/gi, "_");
      const filePath = path.join("./tmp/", fileName);

      await client.sendMessage(
        m.chat,
        {
          image: { url: data.image },
          caption: `🎶 *${data.title}*\n⏳ *Descargando rápido...*`
        },
        { quoted: m }
      );

      exec(`curl -L "${data.download.url}" -o "${filePath}"`, async (err) => {
        if (err) return m.reply("❌ Error descargando el MP3.");

        await client.sendMessage(
          m.chat,
          {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            fileName
          },
          { quoted: m }
        );

        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 4000);
      });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
