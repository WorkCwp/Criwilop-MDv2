module.exports = {
  command: ["ship", "compatibilidad"],
  description: "Mide la compatibilidad entre dos personas",
  category: "fun",
  ownerOnly: false,

  run: async (client, m) => {
    try {
      const mentioned = m.mentionedJid;
      if (!mentioned || mentioned.length < 2)
        return m.reply("💞 Menciona a dos personas\n\nEjemplo: !ship @persona1 @persona2");

      const love = Math.floor(Math.random() * 101);
      const bar = "❤️".repeat(love / 10) + "💔".repeat(10 - love / 10);
      await client.sendMessage(m.chat, {
        text: `💘 *Compatibilidad amorosa*\n\n@${mentioned[0].split("@")[0]} ❤️ @${mentioned[1].split("@")[0]}\n\n${bar}\n\n💖 *Resultado:* ${love}%`,
        mentions: mentioned,
      });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ Error al calcular compatibilidad.");
    }
  },
};