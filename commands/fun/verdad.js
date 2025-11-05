const verdades = [
  "💬 ¿Cuál ha sido tu mentira más grande?",
  "💞 ¿Quién te gusta en secreto?",
  "😳 ¿Qué es lo más vergonzoso que has hecho?",
  "🎯 ¿Tienes un crush aquí en el grupo?",
  "🤔 ¿Qué harías si fueras invisible por un día?"
];

module.exports = {
  command: ["verdad"],
  description: "Envía una pregunta de verdad",
  category: "fun",

  run: async (client, m) => {
    const verdad = verdades[Math.floor(Math.random() * verdades.length)];
    await client.sendMessage(m.chat, { text: verdad }, { quoted: m });
  },
};