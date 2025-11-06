const play = require("play-dl");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  command: ["play", "mp3"],
  description: "Descarga música en MP3 desde YouTube",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");
      if (!query) {
        return client.sendMessage(
          m.chat,
          { text: "❗ Escribe el nombre o URL de la canción.\nEjemplo:\n*play Shakira Monotonía*" },
          { quoted: m }
        );
      }
      
      const searching = await client.sendMessage(
        m.chat,
        { text: "🔍 Buscando canción..." },
        { quoted: m }
      );

      const result = await play.search(query, { limit: 1 });
      if (!result.length)
        return client.sendMessage(
          m.chat,
          { text: "⚠️ No se encontró esa canción." },
          { quoted: m }
        );

      const song = result[0];
      const title = song.title.replace(/[^\w\s]/gi, "");
      const file = path.join("./tmp", `${title}.mp3`);
      
      await client.sendMessage(
        m.chat,
        {
          image: { url: song.thumbnails[0].url },
          caption: `🎧 *${song.title}*\n📺 ${song.channel.name}\n⏱️ ${song.durationRaw}\n\n⏬ Descargando...`,
        },
        { quoted: m }
      );

      const stream = await play.stream(song.url, { quality: 2 });
      const writer = fs.createWriteStream(file);
      stream.stream.pipe(writer);

      writer.on("finish", async () => {
        await client.sendMessage(
          m.chat,
          {
            audio: { url: file },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
          },
          { quoted: m }
        );

        setTimeout(() => fs.unlinkSync(file), 2000);
      });

      writer.on("error", (e) => {
        console.error(e);
        client.sendMessage(m.chat, { text: "❌ Error descargando el audio." }, { quoted: m });
      });

    } catch (error) {
      console.error("❌ Error en comando:", error);
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Hubo un error ejecutando el comando." },
        { quoted: m }
      );
    }
  },
};
