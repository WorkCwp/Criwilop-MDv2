const os = require("os");
const pkg = require("../../package.json");

module.exports = {
  command: ["info"],
  category: "general",
  run: async (client, m, args, from) => {
    const up = process.uptime(),
      h = Math.floor(up / 3600),
      min = Math.floor((up % 3600) / 60),
      s = Math.floor(up % 60);
    const cpu = os.cpus()[0]?.model.trim() || "Desconocido",
      cores = os.cpus().length;
    const mem = [
      (os.freemem() / 1024 / 1024).toFixed(0),
      (os.totalmem() / 1024 / 1024).toFixed(0),
    ];
    const platform = `${os.platform()} ${os.release()} (${os.arch()})`;
    const nodeV = process.version;
    const host = os.hostname();
    const shell = process.env.SHELL || process.env.COMSPEC || "desconocido";
    const now = new Date().toLocaleString("en-US", {
      timeZone: "America/Mexico_City",
      hour12: false,
    });

 const chatId = typeof from === "object" ? m.key.remoteJid : from;

       await client.sendMessage(chatId, {
        react: { text: "📄", key: m.key },
      });

    const info = `*_Criwilop-MD_*

*Versión:* ${pkg.version}
*Autor:* <WorkCwp/>
*Uptime:* ${h}h ${min}m ${s}s
*Plataforma:* ${platform}
*Node.js:* ${nodeV}
*Host:* ${host}
*Shell:* ${shell}

*CPU:* ${cpu} (${cores} núcleos)
*Memoria:* ${mem[0]} MiB libre / ${mem[1]} MiB total

*Fecha & Hora:* ${now}`;

    await client.sendMessage(
      m.chat,
      {
        image: { url: "https://i.ibb.co/spNFT9tR/IMG-20251018-WA0061.jpg" },
        caption: info,
      },
      { quoted: m },
    );
  },
};
