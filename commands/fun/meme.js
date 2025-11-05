const axios = require("axios");

module.exports = {
  command: ["meme"],
  description: "Envía un meme aleatorio",
  category: "fun",
  ownerOnly: false,

  run: async (client, m) => {
    try {
      const res = await axios.get("https://meme-api.com/gimme");
      await client.sendMessage(m.chat, {
        image: { url: res.data.url },
        caption: `🤣 *${res.data.title}*`,
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No pude conseguir un meme en este momento.");
    }
  },
};