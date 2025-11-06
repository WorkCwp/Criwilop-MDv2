const play = require("play-dl");
const fs = require("fs");
const path = require("path");

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
      const safeTitle = song.title.replace(/[\\/:*?"<>|]/g, "");
      const file = path.join("./tmp", `${safeTitle}.mp3`);
      const thumb = song.thumbnails?.[song.thumbnails.length - 1]?.url;

      await client.sendMessage(
        m.chat,
        {
          image: { url: thumb },
          caption: `🎧 *${song.title}*
📺 ${song.channel?.name}
⏱️ ${song.durationRaw}

⏬ Descargando...`,
        },
        { quoted: m }
      );

      // play-dl
      let stream = await play.stream(song.url);
      stream = stream.stream;

      const writer = fs.createWriteStream(file);
      stream.pipe(writer);

      writer.on("finish", async () => {
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
      });

      writer.on("error", async (e) => {
        await global.sendError(client, m, e);
      });

    } catch (err) {
      await global.sendError(client, m, err);
    }
  },
};
