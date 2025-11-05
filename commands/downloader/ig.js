const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: ['ig', 'instagram', 'igdl'],
  description: 'Descargar imágenes, reels, videos o historias públicas de Instagram',
  category: 'downloader',

  run: async (client, m, args) => {
    try {
      const url = args[0];
      if (!url || !/instagram\.com\//i.test(url)) {
        return await client.sendMessage(m.chat, { text: '❗ Envia un link válido de Instagram.\nEjemplo:\n`!ig https://www.instagram.com/p/xxxx/`' }, { quoted: m });
      }

      const tmpDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const stamp = Date.now();
      const outTemplate = path.join(tmpDir, `${stamp}.%(ext)s`);

      await client.sendMessage(m.chat, { text: '📥 Descargando contenido, espera...' }, { quoted: m });

      const cmd = `yt-dlp "${url}" -o "${outTemplate}" --no-check-certificate --no-warnings --write-info-json`;
      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          // ✅ Si no hay video, intentar descargar solo imagen
          if (stderr.includes('There is no video in this post')) {
            const altCmd = `yt-dlp --skip-download --write-thumbnail --convert-thumbnails jpg "${url}" -o "${outTemplate}"`;
            return exec(altCmd, async (err2) => {
              if (err2) {
                return await client.sendMessage(m.chat, { text: '❌ No se pudo descargar imagen del post.' }, { quoted: m });
              }

              const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(stamp));
              const img = files.find(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

              if (!img) {
                return await client.sendMessage(m.chat, { text: '❌ No se encontró contenido.' }, { quoted: m });
              }

              await client.sendMessage(m.chat, { image: { url: path.join(tmpDir, img) } }, { quoted: m });
              return cleanup(tmpDir, files);
            });
          }

          console.log('Error IG =>', error);
          return await client.sendMessage(m.chat, { text: '❌ No se pudo descargar el contenido.' }, { quoted: m });
        }

        // ✅ Si sí descargó algo
        const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(stamp));
        if (!files.length) {
          return await client.sendMessage(m.chat, { text: '❌ No se encontró archivo descargado.' }, { quoted: m });
        }

        const json = files.find(f => f.endsWith('.info.json'));
        if (json) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(tmpDir, json)));
            const infoText = `📌 *Instagram*\n👤 Autor: ${data.uploader || 'desconocido'}\n📝 ${data.title || 'Contenido de IG'}`;
            await client.sendMessage(m.chat, { text: infoText }, { quoted: m });
          } catch {}
        }

        // ✅ enviar imágenes o videos
        for (let file of files) {
          const filepath = path.join(tmpDir, file);

          if (/\.(jpg|png|webp)$/i.test(file)) {
            await client.sendMessage(m.chat, { image: { url: filepath } }, { quoted: m });
          } else if (/\.(mp4|mkv|webm)$/i.test(file)) {
            await client.sendMessage(m.chat, { video: { url: filepath } }, { quoted: m });
          }
        }

        cleanup(tmpDir, files);
      });

      function cleanup(dir, flist) {
        setTimeout(() => {
          for (let f of flist) {
            try { fs.unlinkSync(path.join(dir, f)); } catch {}
          }
        }, 30000);
      }

    } catch (err) {
      console.log('Error Instagram:', err);
      await client.sendMessage(m.chat, { text: '❌ Error inesperado descargando.' }, { quoted: m });
    }
  }
};
