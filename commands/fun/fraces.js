const frases = [
  "🌟 Nunca es tarde para ser quien podrías haber sido.",
  "💪 El éxito es la suma de pequeños esfuerzos diarios.",
  "🔥 No esperes oportunidades, créalas.",
  "🌈 Cada día es una nueva oportunidad para brillar.",
  "💫 La disciplina vence al talento."
];

module.exports = {
  command: ["frase", "motivacion"],
  description: "Envía una frase motivacional al azar",
  category: "fun",
  ownerOnly: false,

  run: async (client, m) => {
    try {
      const frase = frases[Math.floor(Math.random() * frases.length)];
      await client.sendMessage(m.chat, { text: frase }, { quoted: m });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No se pudo enviar la frase.");
    }
  },
};