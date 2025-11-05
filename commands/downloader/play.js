const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const yts = require("yt-search");

module.exports = {
  command: ["play", "ytmp3"],
  description: "Busca en YouTube y descarga audio (mp3)",
  category: "downloader",

  run: async (client, m, args) => {
    try {
      if (!args || args.length === 0) {
        return client.sendMessage(m.chat, { text: "🎵 Uso: play <nombre o link de YouTube>" }, { quoted: m });
      }

      const query = args.join(" ");
      const search = await yts(query);
      if (!search.videos || !search.videos.length) {
        return client.sendMessage(m.chat, { text: "❌ No se encontraron resultados." }, { quoted: m });
      }

      const video = search.videos[0];
      const url = video.url;

      // 📌 Send Info
      await client.sendMessage(
        m.chat,
        {
          image: { url: video.image },
          caption:
            `🎧 *${video.title}*\n` +
            `👤 Canal: *${video.author.name}*\n` +
            `⏳ Duración: *${video.timestamp}*\n` +
            `🔗 Link: ${url}\n\n` +
            `⬇️ *Descargando audio...*`
        },
        { quoted: m }
      );

      // 📁 Tmp
      const tmpDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filename = `${Date.now()}.mp3`;
      const filepath = path.join(tmpDir, filename);

      // ▶️ yt-dlp
      const cmd = `yt-dlp -x --audio-format mp3 "${url}" -o "${filepath}"`;
      console.log("[play] ejecutando:", cmd);

      exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, async (err, stdout, stderr) => {
        if (err) {
          console.error("[play] yt-dlp error:", err, stderr);
          return client.sendMessage(m.chat, { text: "❌ Error descargando el audio." }, { quoted: m });
        }

        try {
          const buffer = fs.readFileSync(filepath);
          await client.sendMessage(
            m.chat,
            {
              audio: buffer,
              mimetype: "audio/mpeg",
              fileName: `${video.title}.mp3`,
              caption: `✅ *Descarga lista*\n🎧 ${video.title}`
            },
            { quoted: m }
          );
        } catch (sendErr) {
          console.error("[play] error enviando:", sendErr);
          await client.sendMessage(m.chat, { text: "⚠️ Error al enviar el archivo." }, { quoted: m });
        } finally {
          try {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          } catch (e) {
            console.error("[play] no se pudo borrar tmp:", e);
          }
        }
      });

    } catch (e) {
      console.error("[play] excepción:", e);
      await client.sendMessage(m.chat, { text: "⚠️ Ocurrió un error ejecutando el comando." }, { quoted: m });
    }
  },
};
