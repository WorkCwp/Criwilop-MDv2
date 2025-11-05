const QRCode = require("qrcode");

module.exports = {
  command: ["qr"],
  description: "Genera un código QR con el texto que escribas",
  category: "util",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {
      const texto = args.join(" ");
      if (!texto) return m.reply("🔹 Escribe algo para generar un QR.\nEjemplo: !qr https://whatsapp.com");
      const data = await QRCode.toDataURL(texto);
      const buffer = Buffer.from(data.split(",")[1], "base64");
      await client.sendMessage(m.chat, { image: buffer, caption: "🌀 Aquí tienes tu código QR" }, { quoted: m });
    } catch (err) {
      console.error(err);
      m.reply("⚠️ No se pudo generar el QR.");
    }
  },
};