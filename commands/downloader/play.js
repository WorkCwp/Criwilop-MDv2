const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  command: ["play", "ytmp3", "mp3"],
  description: "Descarga música en MP3 desde YouTube",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");
      if (!query)
        return client.sendMessage(
          m.chat,
          { text: "❗ Escribe una URL o nombre de la canción.\nEjemplo:\n*play Shakira Monotonía*" },
          { quoted: m }
        );

      const searchingMsg = await client.sendMessage(
        m.chat,
        { text: "🔎 Buscando canción..." },
        { quoted: m }
      );

      let videoUrl = query;

      if (!query.startsWith("http://") && !query.startsWith("https://")) {
        const search = await yts(query);

        if (!search.videos || !search.videos.length)
          return client.sendMessage(
            m.chat,
            { text: "⚠️ No encontré resultados en YouTube." },
            { quoted: m }
          );

        videoUrl = search.videos[0].url;
      }

      const api = await axios.get(`https://delirius-apiofc.vercel.app/download/ytmp3?url=${videoUrl}`);
      const data = api.data?.data;

      if (!data || !data.download?.url)
        return client.sendMessage(
          m.chat,
          { text: "❌ Error al generar el MP3." },
          { quoted: m }
        );

      const fileName = data.download.filename || `${data.id}.mp3`;
      const filePath = path.join("./tmp", fileName);

      await client.sendMessage(
        m.chat,
        {
          image: { url: data.image_max_resolution || data.image },
          caption: `🎶 *${data.title}*\n👤 ${data.author}\n📦 ${data.download.size}\n\n⏬ *Descargando MP3...*`
        },
        { quoted: m }
      );

      const writer = fs.createWriteStream(filePath);
      const downloadStream = await axios.get(data.download.url, { responseType: "stream" });
      downloadStream.data.pipe(writer);

      writer.on("finish", async () => {
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

      writer.on("error", async (err) => {
        console.error(err);
        await client.sendMessage(
          m.chat,
          { text: "❌ Error descargando el archivo." },
          { quoted: m }
        );
      });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
