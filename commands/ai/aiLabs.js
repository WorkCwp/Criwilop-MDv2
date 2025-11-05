const axios = require("axios");
const FormData = require("form-data");

/**
 * Cliente AI Labs (Traducción y adaptación a Mini_WaBot)
 */
const aiLabs = {
  api: {
    base: 'https://text2video.aritek.app',
    endpoints: {
      text2img: '/text2img',
      generate: '/txt2videov3',
      video: '/video'
    }
  },

  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept-encoding': 'gzip',
    'content-type': 'application/json',
    authorization: ''
  },

  state: {
    token: null
  },

  setup: {
    cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
    shiftValue: 3,

    dec(text, shift) {
      return [...text].map(c =>
        /[a-z]/.test(c)
          ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
          : /[A-Z]/.test(c)
            ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
            : c
      ).join('');
    },

    async decrypt() {
      if (aiLabs.state.token) return aiLabs.state.token;
      const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
      aiLabs.state.token = decrypted;
      aiLabs.headers.authorization = decrypted;
      return decrypted;
    }
  },

  deviceId() {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  },

  async text2img(prompt) {
    if (!prompt?.trim()) return { success: false, code: 400, result: { error: "⚠️ Debes describir la imagen." } };

    await aiLabs.setup.decrypt();
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("token", aiLabs.state.token);

    try {
      const res = await axios.post(aiLabs.api.base + aiLabs.api.endpoints.text2img, form, {
        headers: { ...aiLabs.headers, ...form.getHeaders() }
      });

      if (res.data.code !== 0 || !res.data.url) {
        return { success: false, code: res.status, result: { error: "⚠️ No fue posible generar la imagen." } };
      }

      return { success: true, code: res.status, result: { url: res.data.url.trim(), prompt } };

    } catch (err) {
      return { success: false, code: err.response?.status || 500, result: { error: err.message } };
    }
  },

  async generate({ prompt = '', type = 'video', isPremium = 1 } = {}) {
    if (!prompt?.trim()) return { success: false, code: 400, result: { error: "⚠️ Debes escribir una descripción." } };

    if (!/^(image|video)$/.test(type)) {
      return { success: false, code: 400, result: { error: "⚠️ Tipo inválido, usa: imagen o video." } };
    }

    if (type === "image") return await aiLabs.text2img(prompt);

    await aiLabs.setup.decrypt();
    const payload = {
      deviceID: aiLabs.deviceId(),
      isPremium,
      prompt,
      used: [],
      versionCode: 59
    };

    try {
      const res = await axios.post(aiLabs.api.base + aiLabs.api.endpoints.generate, payload, {
        headers: aiLabs.headers
      });

      const { code, key } = res.data;
      if (code !== 0 || !key) {
        return { success: false, code: res.status, result: { error: "⚠️ No se pudo obtener clave del servidor." } };
      }

      return await aiLabs.video(key);

    } catch (err) {
      return { success: false, code: err.response?.status || 500, result: { error: err.message } };
    }
  },

  async video(key) {
    if (!key) return { success: false, code: 400, result: { error: "⚠️ Clave inválida." } };

    await aiLabs.setup.decrypt();
    const payload = { keys: [key] };
    const maxAttempts = 100;
    const delay = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await axios.post(aiLabs.api.base + aiLabs.api.endpoints.video, payload, {
          headers: aiLabs.headers,
          timeout: 10000
        });

        const { datas, code } = res.data;
        if (code === 0 && Array.isArray(datas) && datas[0]?.url) {
          return {
            success: true,
            code: res.status,
            result: {
              url: datas[0].url.trim(),
              progress: "100%"
            }
          };
        }
      } catch (err) {
        if (attempt === maxAttempts) {
          return { success: false, code: 504, result: { error: "⏳ Tiempo de espera agotado." } };
        }
      }

      await new Promise(r => setTimeout(r, delay));
    }
  }
};

/**
 * ✅ Comando Mini_WaBot
 */
module.exports = {
  command: ["aiimage", "aivideo"],
  description: "Genera imágenes o videos usando IA desde texto",
  category: "ai",

  run: async (client, m, args) => {
    if (!args[0]) {
      return client.sendMessage(m.chat, { text: "❗ Debes escribir una descripción.\nEjemplo:\n➤ .aiimage castillo medieval\n➤ .aivideo batalla épica" }, { quoted: m });
    }

    const prompt = args.join(" ");

    try {
      if (m.body.startsWith(".aiimage")) {
        const res = await aiLabs.text2img(prompt);
        if (res?.success && res.result.url) {
          return client.sendMessage(m.chat, {
            image: { url: res.result.url },
            caption: `✅ Imagen generada:\n"${prompt}"`
          }, { quoted: m });
        }
      }

      if (m.body.startsWith(".aivideo")) {
        const res = await aiLabs.generate({ prompt, type: "video" });
        if (res?.success && res.result.url) {
          return client.sendMessage(m.chat, {
            video: { url: res.result.url },
            caption: `✅ Video generado:\n"${prompt}"`
          }, { quoted: m });
        }
      }

      await client.sendMessage(m.chat, { text: "⚠️ No fue posible generar contenido. Intenta otra descripción." }, { quoted: m });

    } catch (error) {
      console.log("Error:", error);
      await client.sendMessage(m.chat, { text: "❌ Ocurrió un error ejecutando el comando." }, { quoted: m });
    }
  },
};
