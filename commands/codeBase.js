module.exports = {
  command: ["nombre", "alias"],
  description: "Descripción del comando",
  category: "Categoría (admin, fun, util, etc.)",
  ownerOnly: false, // ← cámbialo a true si quieres que solo el owner lo use

  run: async (client, m, args) => {
    try {
      // Código principal del comando
    } catch (error) {
      console.error("❌ Error en comando:", error);
      await client.sendMessage(m.chat, { text: "⚠️ Hubo un error ejecutando el comando." }, { quoted: m });
    }
  },
};