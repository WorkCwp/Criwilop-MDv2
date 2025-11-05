const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  command: ["wm", "watermark"],
  description: "Cambia el pack y autor de un sticker",
  category: "stickers",
  ownerOnly: false,

  run: async (client, m, args) => {
    try {

      if (
        !m.quoted ||
        !m.quoted.mimetype ||
        !m.quoted.mimetype.includes("webp")
      ) {
        return client.sendMessage(
          m.chat,
          { text: "❗ Debes responder a un sticker.\nEjemplo:\n*wm Hola|Mundo*" },
          { quoted: m }
        );
      }

      // ✅ Obtener texto del comando
      const texto = args.join(" ").trim();
      let packname = global.namebot || "StickerBot";
      let author = global.author || "WorkCwp";

      if (texto.includes("|")) {
        const split = texto.split("|");
        packname = split[0] || packname;
        author = split[1] || author;
      } else if (texto) {
        packname = texto; // autor queda por defecto
      }

      // ✅ Carpeta temporal dinámica
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const inFile = path.join(tmpDir, `sticker_in_${Date.now()}.webp`);
      const outFile = path.join(tmpDir, `sticker_out_${Date.now()}.webp`);

      // ✅ Descargar sticker
      const buffer = await m.quoted.download();
      fs.writeFileSync(inFile, buffer);

      // ✅ Re-encode para animados y normales
      const cmd = `ffmpeg -y -i "${inFile}" -metadata title="${packname}" -metadata artist="${author}" -c:v libwebp -lossless 1 -preset default -loop 0 "${outFile}"`;

      exec(cmd, async (err) => {
        if (err) {
          console.log("❌ Error ejecutando ffmpeg:", err);
          return client.sendMessage(m.chat, { text: "❗ Error procesando el sticker." }, { quoted: m });
        }

        try {
          const newSticker = fs.readFileSync(outFile);

          await client.sendMessage(
            m.chat,
            { sticker: newSticker },
            { quoted: m }
          );

        } catch (e) {
          console.log("❌ Error enviando sticker:", e);
        }

        // ✅ limpiar archivos
        fs.existsSync(inFile) && fs.unlinkSync(inFile);
        fs.existsSync(outFile) && fs.unlinkSync(outFile);
      });

    } catch (error) {
      console.error("❌ Error en comando wm:", error);
      await client.sendMessage(
        m.chat,
        { text: "⚠️ Hubo un error ejecutando el comando." },
        { quoted: m }
      );
    }
  },
};
