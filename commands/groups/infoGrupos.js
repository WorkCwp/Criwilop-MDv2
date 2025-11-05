const fs = require("fs");
const path = require("path");

module.exports = {
  command: ["infogrupo"],
  category: "groups",
  run: async (client, m, args, from) => {
    try {
      const chatId = typeof from === "object" ? m.key.remoteJid : from;

      if (!chatId.endsWith("@g.us")) {
        return await client.sendMessage(chatId, {
          text: "⚠️ *Este comando solo funciona en grupos.*",
        }, { quoted: m });
      }

      await client.sendMessage(chatId, {
        react: { text: "🔍", key: m.key },
      });

      const meta = await client.groupMetadata(chatId);
      const subject = meta.subject || "Sin nombre";
      const description = meta.desc || "No hay descripción.";
      const owner = meta.owner ? `@${meta.owner.split("@")[0]}` : "No definido";
      const size = meta.participants.length;

      const messageText = `*Información del Grupo:*\n\n` +
        `*Nombre:* ${subject}\n` +
        `*Descripción:* ${description}\n` +
        `*Creador:* ${owner}\n` +
        `*Miembros:* ${size}`;

      await client.sendMessage(chatId, {
        text: messageText,
        mentions: meta.owner ? [meta.owner] : [],
      }, { quoted: m });

      await client.sendMessage(chatId, {
        react: { text: "✅", key: m.key },
      });

    } catch (err) {
      console.error("Error en infogrupo:", err);
      await client.sendMessage(m.chat || from, {
        text: "❌ *Error al obtener la información del grupo.*",
      }, { quoted: m });
    }
  },
};