const retos = [
  "📱 Envía el último mensaje que recibiste.",
  "🎤 Canta una canción en nota de voz.",
  "😂 Escribe tu apodo más vergonzoso.",
  "😳 Di algo que nunca le dirías a tu crush.",
  "🙈 Escribe 'soy un bot' en el grupo."
];

module.exports = {
  command: ["reto"],
  description: "Envía un reto aleatorio",
  category: "fun",
  ownerOnly: false,

  run: async (client, m) => {
    const reto = retos[Math.floor(Math.random() * retos.length)];
    await client.sendMessage(m.chat, { text: reto }, { quoted: m });
  },
};