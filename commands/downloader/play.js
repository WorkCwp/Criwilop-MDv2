const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  command: ["play", "mp3", "ytmp3"],
  description: "Descarga música en MP3 rápido sin curl",
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
        const search = await yts(query);
        if (!search.videos.length)
          return m.reply("⚠️ No encontré resultados.");

        videoUrl = search.videos[0].url;
      }

      const apiURL = `https://www.sankavollerei.com/download/ytmp3?apikey=planaai&url=${videoUrl}`;
      const { data } = await axios.get(apiURL);

      if (!data?.result?.download)
        return m.reply("❌ No se pudo generar el MP3.");

      const dlURL = data.result.download;
      const title = data.result.title.replace(/[^\w\s.-]/gi, "_");
      const filePath = path.join("./tmp/", `${title}.mp3`);

      await client.sendMessage(
        m.chat,
        {
          image: { url: data.result.thumbnail },
          caption: `🎶 *${data.result.title}*\n⏳ Descargando sin curl...`,
        },
        { quoted: m }
      );

      const response = await axios({
        url: dlURL,
        method: "GET",
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", async () => {
        await client.sendMessage(
          m.chat,
          {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
          },
          { quoted: m }
        );

        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
      });

      writer.on("error", async (err) => {
        console.error(err);
        return m.reply("❌ Error mientras guardaba el archivo.");
      });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
