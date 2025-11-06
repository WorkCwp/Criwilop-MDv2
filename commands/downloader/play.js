const axios = require("axios");

module.exports = {
  command: ["play", "ytmp3", "mp3"],
  description: "Descarga audio de YouTube en MP3",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");

      if (!query) {
        return client.sendMessage(
          m.chat,
          { text: "❗ Debes escribir el nombre de una canción.\n\nEjemplo:\n*play Shakira*" },
          { quoted: m }
        );
      }

      await client.sendMessage(m.chat, { text: "🔍 Buscando tu música..." }, { quoted: m });

      const api = `https://www.sankavollerei.com/download/ytmp3?apikey=planaai&query=${encodeURIComponent(query)}`;
      const { data } = await axios.get(api);

      if (!data.status || !data.result) {
        return client.sendMessage(
          m.chat,
          { text: "⚠️ No pude encontrar la canción, prueba con otro nombre." },
          { quoted: m }
        );
      }

      const { title, duration, thumbnail, download } = data.result;

      await client.sendMessage(
        m.chat,
        {
          image: { url: thumbnail },
          caption: `🎵 *Canción encontrada*\n\n📌 *Título:* ${title}\n⏱️ *Duración:* ${duration}\n\n🎧 *Descargando audio...*`,
        },
        { quoted: m }
      );
      
      await client.sendMessage(
        m.chat,
        {
          audio: { url: download },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("❌ Error en comando play:", error);
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Hubo un error al descargar el audio." },
        { quoted: m }
      );
    }
  },
};
