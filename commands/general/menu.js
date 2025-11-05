const moment = require("moment-timezone");
const { pickRandom } = require("../../lib/message");
const { version } = require("../../package.json");

module.exports = {
  command: ["help", "ayuda", "menu"],
  description: "Muestra los comandos",
  category: "general",
  run: async (client, m, args) => {
    const cmds = [...global.comandos.values()];
    const time = moment.tz("America/Bogota").format("HH:mm:ss");

    const ucapan =
      time < "05:00:00"
        ? "🌅 Buenos días"
        : time < "12:00:00"
          ? "🌞 Buenos días"
          : time < "18:00:00"
            ? "🌤️ Buenas tardes"
            : "🌙 Buenas noches";

    const fkontak = {
      key: {
        participant: `0@s.whatsapp.net`,
        ...(m.chat ? { remoteJid: `6285600793871-1614953337@g.us` } : {}),
      },
      message: {
        contactMessage: {
          displayName: `${m.pushName || "Usuario"}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${m.pushName || "Usuario"},;;;\nFN:${m.pushName || "Usuario"}\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
          jpegThumbnail: null,
          thumbnail: null,
          sendEphemeral: true,
        },
      },
    };

    // Organizar comandos por categoría
    const categories = {};
    cmds.forEach((cmd) => {
      if (!cmd.command) return;
      const cat = (cmd.category || "Sin categoría").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      if (!categories[cat].some((c) => c.command[0] === cmd.command[0])) {
        categories[cat].push(cmd);
      }
    });

    // 🪄 Encabezado visual
    let menu = `╭━━━┅┅ *✨ MENÚ PRINCIPAL ✨* ┅┅━━━╮
┃
┃ 👋 ${ucapan}, *${m.pushName || "Usuario"}*  
┃ 🤖 Bienvenido/a a *Criwilop-MD*
┃
┃ 👤 *Creador:* +573238031915
┃ 💻 *Versión:* ${version}
┃ 🕓 *Hora actual:* ${time}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

📚 *Comandos disponibles:*
`;

    // 🧭 Sección de comandos organizada
    for (const [cat, commands] of Object.entries(categories)) {
      const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
      menu += `\n💠 *${catName.toUpperCase()}*\n`;
      menu += commands
        .map((cmd) => `   ✦ _!${cmd.command[0]}_`)
        .join("\n");
      menu += `\n`;
    }

    // ✨ Pie decorativo
    menu += `
╭───────────────✦
│ 🧩 Usa *!comando* para ejecutar
│ 📬 Ejemplo: *!ping*
│ 💫 Disfruta usando *Criwilop-MD*
╰───────────────✦
`;

    await client.sendMessage(
      m.chat,
      {
        image: { url: "https://i.ibb.co/spNFT9tR/IMG-20251018-WA0061.jpg" },
        caption: menu.trim(),
      },
      { quoted: fkontak },
    );
  },
};