const gtts = require("node-gtts")("es");

module.exports = {
  command: ["tts", "voz"],
  description: "Convierte texto a voz (español)",
  category: "util",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const texto = args.join(" ");
      if (!texto) return m.reply("💬 Escribe algo para convertir a voz.\nEjemplo: !tts Hola, ¿cómo estás?");
      const file = "././tmp/voz.mp3";
      await new Promise((res, rej) => gtts.save(file, texto, (err) => (err ? rej(err) : res())));
      await client.sendMessage(m.chat, { audio: { url: file }, mimetype: "audio/mp4", ptt: true }, { quoted: m });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No se pudo generar el audio.");
    }
  },
};