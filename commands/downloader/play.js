const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
const { exec } = require("child_process");

module.exports = {
  command: ["play", "mp3", "ytmp3"],
  description: "Descarga música en MP3 rápido ✅",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");
      if (!query)
        return client.sendMessage(
          m.chat,
          { text: "❗ *Escribe nombre o link*\nEjemplo: `play Shakira`" },
          { quoted: m }
        );

      let videoUrl = query;
      if (!query.startsWith("http")) {
        const s = await yts(query);
        if (!s.videos.length)
          return m.reply("⚠️ No encontré resultados.");
        videoUrl = s.videos[0].url;
      }

      const { data } = await axios.get(
        `https://delirius-apiofc.vercel.app/download/ytmp3?url=${videoUrl}`
      );

      const info = data?.data;
      if (!info || !info.download?.url)
        return m.reply("❌ Error generando el audio.");

      const downloadUrl = info.download.url;

      const cleanName = info.title.replace(/[^\w\s.-]/gi, "_");
      const filePath = path.join("./tmp/", `${cleanName}.mp3`);

      await client.sendMessage(
        m.chat,
        {
          image: { url: info.image },
          caption: `🎶 *${info.title}*\n⏳ *Descargando a máxima velocidad...*`
        },
        { quoted: m }
      );

      exec(`curl -L --silent "${downloadUrl}" -o "${filePath}"`, async (error) => {
        if (error) {
          console.error(error);
          return m.reply("❌ Error descargando el archivo.");
        }

        await client.sendMessage(
          m.chat,
          {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            fileName: `${cleanName}.mp3`,
          },
          { quoted: m }
        );

        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
      });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
