const translate = require("@vitalets/google-translate-api");

module.exports = {
  command: ["traducir", "translate"],
  description: "Traduce texto a otro idioma",
  category: "util",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const lang = args[0];
      const texto = args.slice(1).join(" ");
      if (!lang || !texto)
        return m.reply("📘 Usa: !traducir <idioma> <texto>\nEjemplo: !traducir en Hola mundo");

      const res = await translate(texto, { to: lang });
      m.reply(`🌍 *Traducción (${lang.toUpperCase()})*\n\n${res.text}`);
    } catch (err) {
      console.error(err);
      m.reply("⚠️ Error al traducir el texto.");
    }
  },
};