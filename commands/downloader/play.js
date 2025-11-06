const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
          { text: `❗ Escribe el nombre o URL del video.\nEjemplo:\n*play Summertime Sadness*` },
          { quoted: m }
        );

      const waitMsg = await client.sendMessage(m.chat, { text: "🔍 Buscando canción..." }, { quoted: m });

      let videoUrl = query;
      
      if (!query.startsWith("http")) {
        const yt = await axios.get(
          `https://ytsearch.yandexapi.xyz/search?q=${encodeURIComponent(query)}`
        );

        if (!yt.data || !yt.data.result || !yt.data.result[0])
          return client.sendMessage(m.chat, { text: "⚠️ No encontré resultados." }, { quoted: m });

        videoUrl = yt.data.result[0].url;
      }

      // ✅ API
      const api = await axios.get(`https://delirius-apiofc.vercel.app/download/ytmp3?url=${videoUrl}`);

      if (!api.data || !api.data.status || !api.data.data.download.url)
        return client.sendMessage(m.chat, { text: "❌ Error obteniendo audio." }, { quoted: m });

      const info = api.data.data;
      const filePath = path.join("./tmp", `${info.id}.mp3`);

      await client.sendMessage(
        m.chat,
        {
          image: { url: info.image_max_resolution || info.image },
          caption: `🎧 *${info.title}*\n👤 ${info.author}\n⏱️ ${info.duration}s\n📥 *Descargando MP3...*`
        },
        { quoted: m }
      );

      const writer = fs.createWriteStream(filePath);
      const downloadStream = await axios.get(info.download.url, { responseType: "stream" });
      downloadStream.data.pipe(writer);

      writer.on("finish", async () => {
        await client.sendMessage(
          m.chat,
          {
            audio: { url: filePath },
            mimetype: "audio/mpeg",
            fileName: info.download.filename
          },
          { quoted: m }
        );

        setTimeout(() => fs.unlinkSync(filePath), 3000);
      });

      writer.on("error", async (err) => {
        await client.sendMessage(m.chat, { text: "❌ Error descargando el archivo." }, { quoted: m });
        console.error(err);
      });

    } catch (err) {
      await global.sendError(client, m, err); 
    }
  },
};
