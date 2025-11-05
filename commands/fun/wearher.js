const axios = require("axios");

module.exports = {
  command: ["clima", "weather"],
  description: "Muestra el clima actual de una ciudad",
  category: "util",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const ciudad = args.join(" ");
      if (!ciudad) return m.reply("🌦️ Escribe una ciudad.\nEjemplo: !clima Bogotá");

      const res = await axios.get(`https://wttr.in/${encodeURIComponent(ciudad)}?format=%C+%t`);
      m.reply(`🌤️ *Clima en ${ciudad}:* ${res.data}`);
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No se pudo obtener el clima.");
    }
  },
};