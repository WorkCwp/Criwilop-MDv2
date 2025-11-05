const fs = require("fs");
const chalk = require("chalk");

global.owner = ["573238031915"];
global.sessionName = "auth";
global.version = "v1.0.0";
global.namebot = "Criwilop-MD";
global.author = "";

global.mess = {
  admin: "→ Esta función está reservada para los administradores del grupo",
  botAdmin: "→ Para ejecutar esta función debo ser administrador",
  owner: "→ Solo mi creador puede usar este comando",
  group: "→ Esta función solo funciona en grupos",
  private: "→ Esta función solo funciona en mensajes privados",
  wait: "→ Espera un momento...",
};

global.thumbnailUrl = "https://i.ibb.co/spNFT9tR/IMG-20251018-WA0061.jpg";

global.my = {
  ch: "120363346362095295@newsletter",
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualización '${__filename}'`));
  delete require.cache[file];
  require(file);
});
