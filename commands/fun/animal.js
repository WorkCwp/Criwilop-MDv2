const axios = require("axios");

module.exports = {
  command: ["animal", "perro", "gato"],
  description: "Envía una imagen aleatoria de un animal",
  category: "fun",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const tipo = args[0] || "perro";
      let url = "https://random.dog/woof.json";
      if (tipo === "gato") url = "https://api.thecatapi.com/v1/images/search";

      const res = await axios.get(url);
      const img = tipo === "gato" ? res.data[0].url : res.data.url;
      await client.sendMessage(m.chat, { image: { url: img }, caption: `🐾 Aquí tienes un ${tipo}!` });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No pude traer una imagen.");
    }
  },
};