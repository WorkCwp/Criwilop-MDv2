const respuestas = [
  "Sí, definitivamente ✅",
  "No ❌",
  "Tal vez 🤔",
  "Pregúntame más tarde ⏳",
  "No cuentes con ello 😬",
  "Totalmente posible 🌟",
  "Ni lo sueñes 😴",
  "Parece probable 👍"
];

module.exports = {
  command: ["8ball", "bola", "pregunta"],
  description: "Responde preguntas como una bola mágica 🎱",
  category: "fun",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const pregunta = args.join(" ");
      if (!pregunta) return m.reply("🎱 Escribe una pregunta.\nEjemplo: !8ball ¿me ama?");
      const res = respuestas[Math.floor(Math.random() * respuestas.length)];
      await client.sendMessage(m.chat, { text: `🎱 *Pregunta:* ${pregunta}\n💬 *Respuesta:* ${res}` }, { quoted: m });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No se pudo responder.");
    }
  },
};