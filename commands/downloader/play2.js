const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const yts = require("yt-search");

module.exports = {
  command: ["playvideo", "ytmp4", "videomp4"],
  description: "Busca en YouTube y descarga el video (mp4)",
  category: "downloader",

  run: async (client, m, args) => {
    try {
      if (!args || args.length === 0) {
        return client.sendMessage(
          m.chat,
          { text: "🎬 Uso: playvideo <nombre o link de YouTube>" },
          { quoted: m }
        );
      }

      const query = args.join(" ");
      const search = await yts(query);
      if (!search.videos || !search.videos.length) {
        return client.sendMessage(m.chat, { text: "❌ No se encontraron resultados." }, { quoted: m });
      }

      const video = search.videos[0];
      const url = video.url;

      // 📌 Información con miniatura
      await client.sendMessage(
        m.chat,
        {
          image: { url: video.image },
          caption:
            `🎬 *${video.title}*\n` +
            `👤 Canal: *${video.author.name}*\n` +
            `⏳ Duración: *${video.timestamp}*\n` +
            `🔗 Link: ${url}\n\n` +
            `⬇️ *Descargando video...*`
        },
        { quoted: m }
      );

      // Directorio temporal
      const tmpDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const filename = `${Date.now()}.mp4`;
      const filepath = path.join(tmpDir, filename);

      // ▶️ Ejecuta yt-dlp para MP4 calidad buena pero ligera
      const cmd = `yt-dlp -f "best[ext=mp4][height<=720]" "${url}" -o "${filepath}"`;

      exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, async (err, stdout, stderr) => {
        if (err || !fs.existsSync(filepath)) {
          console.error("[playvideo] yt-dlp error:", err, stderr);
          return client.sendMessage(m.chat, { text: "❌ Error descargando el video." }, { quoted: m });
        }

        try {
          const buffer = fs.readFileSync(filepath);

          await client.sendMessage(
            m.chat,
            {
              video: buffer,
              mimetype: "video/mp4",
              caption: `✅ *Descarga lista*\n🎬 ${video.title}`
            },
            { quoted: m }
          );

        } catch (sendErr) {
          console.error("[playvideo] error al enviar:", sendErr);
          await client.sendMessage(m.chat, { text: "⚠️ Error al enviar el video." }, { quoted: m });
        } finally {
          try {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          } catch (e) {
            console.error("[playvideo] no se pudo borrar tmp:", e);
          }
        }
      });

    } catch (e) {
      console.error("[playvideo] excepción:", e);
      await client.sendMessage(m.chat, { text: "⚠️ Ocurrió un error ejecutando el comando." }, { quoted: m });
    }
  },
};
