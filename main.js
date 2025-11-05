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

seeCommands();

// ========= SISTEMA SUBBOT ========= //

global.subbotManager = {
  subbots: {},

  async createSubbot(m, client) {
    const id = m.sender.replace("@s.whatsapp.net", "");
    const folder = path.join("./subbots", id);

    try {
      // Crear carpetas si no existen
      if (!fs.existsSync("./subbots")) fs.mkdirSync("./subbots");
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);

      const { state, saveCreds } = await useMultiFileAuthState(folder);

      const bot = makeWASocket({
        auth: state,
        browser: ["Chrome", "Ubuntu", "22.04"],
        markOnlineOnConnect: true,
        syncFullHistory: true,
        fireInitQueries: true,
        printQRInTerminal: false // eliminado el warning
      });

      bot.ev.on("creds.update", saveCreds);

      // ✅ Enviar QR por WhatsApp
      bot.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
          try {
            const qrImage = await qrcode.toBuffer(qr);
            await client.sendMessage(m.chat, {
              image: qrImage,
              caption: "🔵 Escanea este QR para conectar tu SUBBOT"
            });
          } catch (e) {
            console.log("Error enviando QR:", e);
          }
        }

        // ✅ Conectado correctamente
        if (connection === "open") {
          global.subbotManager.subbots[id] = bot;
          await client.sendMessage(m.chat, {
            text: "✅ Subbot conectado correctamente.\nAhora puedes usar comandos igual que el bot principal."
          });
        }

        // ✅ Reconexión automática si falla
        if (connection === "close") {
          const reason = lastDisconnect?.error?.output?.statusCode;
          if (reason !== DisconnectReason.loggedOut) {
            console.log("⚠️ Subbot desconectado, reconectando...");
            global.subbotManager.createSubbot(m, client);
          }
        }
      });

    } catch (e) {
      console.log("❌ Error creando subbot:", e);
      await client.sendMessage(m.chat, {
        text: "⚠️ Error creando el subbot."
      });
    }
  }
};

// ========= BOT PRINCIPAL ========= //
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

  let groupMetadata, groupAdmins, resolvedAdmins = [], groupName = "";
  if (m.isGroup) {
    groupMetadata = await client.groupMetadata(m.chat).catch((_) => null);
    groupName = groupMetadata?.subject || "";
    groupAdmins = groupMetadata?.participants.filter(p => p.admin === "admin" || p.admin === "superadmin") || [];
    resolvedAdmins = await Promise.all(
      groupAdmins.map((adm) =>
        resolveLidToRealJid(adm.jid, client, m.chat).then((realJid) => ({
          ...adm,
          jid: realJid,
        })),
      ),
    );
  }

  const isBotAdmins = m.isGroup ? resolvedAdmins.some((p) => p.jid === botJid) : false;
  const isAdmins = m.isGroup ? resolvedAdmins.some((p) => p.jid === m.sender) : false;

  // ✅ LOG BONITO
  const h = chalk.bold.blue("ೋ❀❀ೋ═════════════════════════════ೋ❀❀ೋ");
  const v = chalk.bold.white("┋");
  const date = chalk.bold.yellow(`\n${v} Fecha: ${chalk.whiteBright(moment().format("DD/MM/YY HH:mm:ss"))}`);
  const userPrint = chalk.bold.blueBright(`\n${v} Usuario: ${chalk.whiteBright(pushname)}`);
  const senderPrint = chalk.bold.magentaBright(`\n${v} Remitente: ${gradient("deepskyblue", "darkorchid")(sender)}`);
  const groupPrint = m.isGroup
    ? chalk.bold.cyanBright(`\n${v} Grupo: ${chalk.greenBright(groupName)}\n${v} ID: ${gradient("violet", "midnightblue")(from)}\n${v}`)
    : chalk.bold.greenBright(`\n${v} Chat privado\n`);
  console.log(`\n${h}${date}${userPrint}${senderPrint}${groupPrint}${h}`);

  // ✅ EJECUCIÓN DE COMANDOS DEL BOT PRINCIPAL
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

  // ✅ EJECUCIÓN DE COMANDOS PARA SUBBOTS
  if (global.subbotManager && global.subbotManager.subbots) {
    Object.values(global.subbotManager.subbots).forEach(bot => {
      try {
        require("./lib/system/commandLoader")(bot, m);
      } catch {}
    });
  }
};

// AUTO-UPDATE
const mainFile = require.resolve(__filename);
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile);
  console.log(chalk.yellowBright(`\nSe actualizó ${path.basename(__filename)}, recargando...`));
  delete require.cache[mainFile];
  require(mainFile);
});
