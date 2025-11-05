module.exports = {
  command: ["serbot", "subbot"],
  description: "Crea un subbot usando tu propio número",
  category: "owner",
  ownerOnly: false,

  run: async (client, m) => {
    if (!global.subbotManager) {
      return client.sendMessage(m.chat, { text: "⚠️ El sistema subbot no está disponible." });
    }

    await client.sendMessage(m.chat, { text: "⌛ Generando enlace QR, espera..." });
    await global.subbotManager.createSubbot(m, client);
  }
};
