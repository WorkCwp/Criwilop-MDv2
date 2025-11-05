require("./settings");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const chalk = require("chalk");
const gradient = require("gradient-string");
const seeCommands = require("./lib/system/commandLoader");
const initDB = require("./lib/system/initDB");
const antilink = require("./commands/antilink");
const { resolveLidToRealJid } = require("./lib/utils");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const groupCache = new Map();

seeCommands();

module.exports = async (client, m) => {
  let body = "";

  if (m.message) {
    if (m.message.conversation) body = m.message.conversation;
    else if (m.message.extendedTextMessage?.text) body = m.message.extendedTextMessage.text;
    else if (m.message.imageMessage?.caption) body = m.message.imageMessage.caption;
    else if (m.message.videoMessage?.caption) body = m.message.videoMessage.caption;
    else if (m.message.buttonsResponseMessage?.selectedButtonId) body = m.message.buttonsResponseMessage.selectedButtonId;
    else if (m.message.listResponseMessage?.singleSelectReply?.selectedRowId) body = m.message.listResponseMessage.singleSelectReply.selectedRowId;
    else if (m.message.templateButtonReplyMessage?.selectedId) body = m.message.templateButtonReplyMessage.selectedId;
  }

  initDB(m);
  antilink(client, m);

  const prefa = ['.', '!', '#', '/']
  const prefix = prefa.find((p) => body.startsWith(p))
  if (!prefix) return

  const from = m.key.remoteJid;
  const args = body.trim().split(/ +/).slice(1);
  const text = args.join(" ");
  const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

  const command = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
  const pushname = m.pushName || "Sin nombre";
  const sender = m.isGroup ? m.key.participant || m.participant : m.key.remoteJid;

  let groupMetadata,
  groupAdmins,
  resolvedAdmins = [],
  groupName = "";

if (m.isGroup) {
  const groupId = m.chat;
  const now = Date.now();
  const cached = groupCache.get(groupId);

  if (cached && now < cached.expire) {
    groupMetadata = cached.data;
    groupAdmins = cached.admins;
    resolvedAdmins = cached.resolvedAdmins;
  } else {
    groupMetadata = await client.groupMetadata(groupId).catch(() => null);

    groupAdmins =
      groupMetadata?.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin",
      ) || [];

    resolvedAdmins = await Promise.all(
      groupAdmins.map((adm) =>
        resolveLidToRealJid(adm.jid, client, groupId).then((realJid) => ({
          ...adm,
          jid: realJid,
        })),
      ),
    );
    
    groupCache.set(groupId, {
      data: groupMetadata,
      admins: groupAdmins,
      resolvedAdmins,
      expire: now + 60_000, // 60s
    });
  }

  groupName = groupMetadata?.subject || "";
}

  const isBotAdmins = m.isGroup ? resolvedAdmins.some((p) => p.jid === botJid) : false;
  const isAdmins = m.isGroup ? resolvedAdmins.some((p) => p.jid === m.sender) : false;

  // ✅ STYLE
const line = chalk.hex("#00eaff")("════════════════════════════════════════════");

console.log(chalk.hex("#00eaff")("\n┌" + line));
console.log(chalk.hex("#00eaff")(`│  🕒 Fecha     : `) + chalk.whiteBright(moment().format("DD/MM/YY HH:mm:ss")));
console.log(chalk.hex("#00eaff")(`│  👤 Usuario   : `) + chalk.greenBright(pushname));
console.log(chalk.hex("#00eaff")(`│  💬 Remitente : `) + chalk.magentaBright(sender));

if (m.isGroup) {
  console.log(chalk.hex("#00eaff")(`│  👥 Grupo     : `) + chalk.yellowBright(groupName));
  console.log(chalk.hex("#00eaff")(`│  🆔 ID        : `) + chalk.cyanBright(from));
} else {
  console.log(chalk.hex("#00eaff")(`│  🔒 Tipo      : Chat privado`));
}

console.log(chalk.hex("#00eaff")("└" + line + "\n"));

  // ✅ CMD
  if (global.comandos.has(command)) {
    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    if (cmdData.isOwner && !global.owner.map((num) => num + "@s.whatsapp.net").includes(m.sender))
      return m.reply(mess.owner);
    if (cmdData.isReg && !db.data.users[m.sender]?.registered) return m.reply(mess.registered);
    if (cmdData.isGroup && !m.isGroup) return m.reply(mess.group);
    if (cmdData.isAdmin && !isAdmins) return m.reply(mess.admin);
    if (cmdData.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin);
    if (cmdData.isPrivate && m.isGroup) return m.reply(mess.private);

    try {
      await cmdData.run(client, m, args, { text });
    } catch (error) {
      console.error(chalk.red(`Error ejecutando comando ${command}:`), error);
      await client.sendMessage(m.chat, { text: "Error al ejecutar el comando" }, { quoted: m });
    }
  }
};

// UPDATE
const mainFile = require.resolve(__filename);
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile);
  console.log(chalk.yellowBright(`\nSe actualizó ${path.basename(__filename)}, recargando...`));
  delete require.cache[mainFile];
  require(mainFile);
});

setInterval(() => {
  const now = Date.now();
  for (const [id, obj] of groupCache) {
    if (now > obj.expire) groupCache.delete(id);
  }
}, 120_000);
