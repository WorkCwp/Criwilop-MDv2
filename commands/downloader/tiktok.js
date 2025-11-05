const axios = require("axios");

module.exports = {
  command: ["tiktok", "tt", "tiktokdl"],
  description: "Descargar videos de TikTok",
  category: "downloader",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return client.sendMessage(
          m.chat,
          { text: "📌 Ejemplo:\n`tiktok https://www.tiktok.com/@user/video/123`" },
          { quoted: m }
        );
      }

      let url = args[0];

      // API funcional
      const api = await axios.post("https://tikwm.com/api/", {
        url,
        hd: 1
      });

      if (!api.data || !api.data.data || !api.data.data.play) {
        return client.sendMessage(
          m.chat,
          { text: "❌ No se pudo descargar el video. Intenta con otro enlace." },
          { quoted: m }
        );
      }

      const video = api.data.data.play; // video HD sin marca de agua
      const titulo = api.data.data.title || "Video de TikTok";

      await client.sendMessage(
        m.chat,
        { video: { url: video }, caption: `✅ *TikTok Descargado*\n🎬 ${titulo}` },
        { quoted: m }
      );

    } catch (error) {
      console.error(error);
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Ocurrió un error descargando el TikTok." },
        { quoted: m }
      );
    }
  },
};