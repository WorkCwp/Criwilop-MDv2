const { default: makeWASocket, useMultiFileAuthState, Browsers } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { exec } = require("child_process");

const SUBBOT_DIR = "./subbot_auth";
if (!fs.existsSync(SUBBOT_DIR)) fs.mkdirSync(SUBBOT_DIR);

class SubBotManager {

    constructor(client) {
        this.mainBot = client;
        this.subbots = {};
    }

    async createSubBot(chat) {
        const sessionPath = path.join(SUBBOT_DIR, chat);

        if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath);

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const conn = makeWASocket({
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.macOS("Safari")
        });

        conn.ev.on("creds.update", saveCreds);

        conn.ev.on("connection.update", async ({ qr, connection }) => {
            if (qr) {
                const qrImagePath = `${sessionPath}/qr.png`;
                await QRCode.toFile(qrImagePath, qr);

                await this.mainBot.sendMessage(chat, {
                    image: { url: qrImagePath },
                    caption: "📌 Escanea este QR desde WhatsApp para vincular tu SubBot.\n⚠️ Tienes 30 segundos."
                });

                setTimeout(() => {
                    if (!this.subbots[chat]?.connected) {
                        this.mainBot.sendMessage(chat, { text: "⛔ Falló la vinculación. Intenta otra vez con .serbot" });
                    }
                }, 30000);
            }

            if (connection === "open") {
                this.subbots[chat] = conn;
                conn.connected = true;
                await this.mainBot.sendMessage(chat, { text: "✅ SubBot conectado correctamente ✅" });

                conn.ev.on("messages.upsert", async ({ messages }) => {
                    require("./system/commandHandler")(conn, messages[0]);
                });
            }
        });
    }

    async stopSubBot(chat) {
        if (this.subbots[chat]) {
            try {
                this.subbots[chat].end();
                delete this.subbots[chat];
                await this.mainBot.sendMessage(chat, { text: "✅ SubBot desconectado correctamente." });
            } catch (e) {
                await this.mainBot.sendMessage(chat, { text: "⚠️ No se pudo desconectar." });
            }
        } else {
            await this.mainBot.sendMessage(chat, { text: "⚠️ No tienes SubBot activo." });
        }
    }

    listSubBots() {
        return Object.keys(this.subbots);
    }
}

module.exports = SubBotManager;
