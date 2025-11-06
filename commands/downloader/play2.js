const axios = require("axios");

module.exports = {
  command: ["play2", "ytmp4", "mp4"],
  description: "Descarga video de YouTube en MP4",
  category: "downloader",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const query = args.join(" ");

      if (!query) {
        return client.sendMessage(
          m.chat,
          { text: "❗ Escribe el nombre del video.\n\nEjemplo:\n*play2 Bad Bunny*" },
          { quoted: m }
        );
      }

      await client.sendMessage(m.chat, { text: "🎬 Buscando tu video..." }, { quoted: m });

      const api = `https://www.sankavollerei.com/download/ytmp4?apikey=planaai&query=${encodeURIComponent(query)}`;
      const { data } = await axios.get(api);

      if (!data.status || !data.result) {
        return client.sendMessage(
          m.chat,
          { text: "⚠️ No pude encontrar el video, intenta con otro nombre." },
          { quoted: m }
        );
      }

      const { title, duration, thumbnail, download } = data.result;

      await client.sendMessage(
        m.chat,
        {
          image: { url: thumbnail },
          caption: `✅ *Video encontrado*\n\n📌 *Título:* ${title}\n⏱️ *Duración:* ${duration}\n\n🎥 *Descargando video...*`,
        },
        { quoted: m }
      );

      await client.sendMessage(
        m.chat,
        {
          video: { url: download },
          caption: `✅ *Aquí está tu video*`,
          mimetype: "video/mp4",
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("❌ Error en comando play2:", error);
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Hubo un error al descargar el video." },
        { quoted: m }
      );
    }
  },
};
