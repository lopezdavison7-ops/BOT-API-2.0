import type { WASocket, proto } from 'baileys';
import type { Command, CommandContext, CommandMap } from './types/command.js';
import { loadCommands } from './core/cmdManager.js';
import fs from 'fs';
import path from 'path';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const PREFIJO = '.';
const RUTA_AFK = path.join(process.cwd(), 'database', 'afk.json');

// ============================================================
// ESTADO GLOBAL
// ============================================================

let comandos: CommandMap | null = null;
let botJid: string | null = null;

// ============================================================
// UTILIDADES
// ============================================================

interface AFKData {
  tiempo: number;
  razon?: string;
  nombre?: string;
}

function leerAfk(): Record<string, AFKData> {
  try {
    return JSON.parse(fs.readFileSync(RUTA_AFK, 'utf8'));
  } catch {
    return {};
  }
}

function guardarAfk(db: Record<string, AFKData>): void {
  fs.mkdirSync(path.dirname(RUTA_AFK), { recursive: true });
  fs.writeFileSync(RUTA_AFK, JSON.stringify(db, null, 2), 'utf8');
}

function fmtTiempo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function extraerTexto(msg: proto.IWebMessageInfo): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  ).trim();
}

// ============================================================
// CARGAR COMANDOS
// ============================================================

export async function cargarComandosHandler(): Promise<CommandMap> {
  if (!comandos) {
    comandos = await loadCommands();
    console.log(`[HANDLER] ✅ Comandos cargados: ${comandos.size}`);
  }
  return comandos;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export async function handleMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo
): Promise<void> {
  try {
    // Cargar comandos si no están cargados
    if (!comandos) {
      comandos = await loadCommands();
    }

    // Inicializar botJid
    if (!botJid && sock.user?.id) {
      botJid = sock.user.id;
    }

    // Validaciones básicas
    if (!msg.message) return;
    if (msg.key.remoteJid === 'status@broadcast') return;

    const jid = msg.key.remoteJid!;
    const fromMe = msg.key.fromMe || false;
    const isGroup = jid?.endsWith('@g.us') || false;

    // ========================================================
    // DETECTOR AFK
    // ========================================================
    if (!fromMe) {
      try {
        const textoMsg = extraerTexto(msg);
        const esComandoAfk = /^\.afk/i.test(textoMsg);

        if (!esComandoAfk) {
          const db = leerAfk();
          const sender = msg.key.participant || msg.key.remoteJid;

          if (sender && db[sender]) {
            const data = db[sender];
            delete db[sender];
            guardarAfk(db);

            let textoUser = '@' + String(sender).split('@')[0].replace(/\D/g, '');
            let mentions = [sender];

            // Intentar resolver LID a número real
            try {
              if (sender.endsWith('@lid')) {
                // Aquí podrías implementar resolución de LID si tu baileys lo soporta
              }
            } catch {}

            const mensajeAFK = 
              `╭━━〔 ✅ 𝐕𝐎𝐋𝐕𝐈𝐒𝐓𝐄 〕━━⬣\n` +
              `┃\n` +
              `┃ 🎉 ${textoUser} ya regresaste!\n` +
              `┃\n` +
              `┃ 💤 Estuviste AFK: *${fmtTiempo(Date.now() - data.tiempo)}*\n` +
              (data.razon ? `┃ 📝 Razón: ${data.razon}\n` : '') +
              `┃\n` +
              `┃ 🎈 Bienvenido de vuelta\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(jid, { text: mensajeAFK, mentions }, { quoted: msg });
          }
        }
      } catch (error) {
        console.error('[AFK] Error:', error);
      }
    }

    // ========================================================
    // ANTILINK (placeholder - implementar si lo tienes)
    // ========================================================
    if (isGroup && !fromMe) {
      // Aquí iría tu lógica de antilink
      // const bloqueado = await revisarAntilink(sock, msg, esAdmin);
      // if (bloqueado) return;
    }

    // ========================================================
    // JUEGOS (placeholder - implementar si los tienes)
    // ========================================================
    if (!fromMe) {
      // const fueTrivia = await manejarMensajeTrivia(sock, msg);
      // if (fueTrivia) return;

      // const fueTetris = await manejarMensajeTetris(sock, msg);
      // if (fueTetris) return;

      // const fueAdivinanza = await manejarMensajeAdivinanza(sock, msg);
      // if (fueAdivinanza) return;

      // const fueTTT = await manejarMensajeTTT(sock, msg);
      // if (fueTTT) return;
    }

    // ========================================================
    // MEMORIA IA (placeholder)
    // ========================================================
    if (!fromMe) {
      // const fueMemoria = await manejarMemoriaIA(sock, msg);
      // if (fueMemoria) return;
    }

    // ========================================================
    // PROCESAR COMANDOS
    // ========================================================
    const texto = extraerTexto(msg);
    if (!texto) return;

    // Verificar si es número de menú
    if (/^\d+$/.test(texto)) {
      const num = parseInt(texto);
      const mapa = (global as any).menuMap?.[jid];
      if (mapa && mapa[num]) {
        // Ejecutar comando del menú
        const catSeleccionada = mapa[num];
        const cmdMenu = comandos.get('menu');
        if (cmdMenu) {
          await cmdMenu.ejecutar({
            sock, msg, args: [catSeleccionada], argumento: catSeleccionada,
            prefijo: PREFIJO, fromMe, isGroup, jid, botJid: botJid!,
            responder: crearResponder(sock, msg, jid)
          });
          return;
        }
      }
    }

    // Verificar prefijo
    if (!texto.startsWith(PREFIJO)) return;

    // Parsear comando
    const sinPrefijo = texto.slice(PREFIJO.length).trim();
    const indiceEspacio = sinPrefijo.search(/\s/);
    const nombreComando = (
      indiceEspacio === -1
        ? sinPrefijo
        : sinPrefijo.slice(0, indiceEspacio)
    ).toLowerCase();

    const argumento = indiceEspacio === -1 ? '' : sinPrefijo.slice(indiceEspacio + 1);
    const args = argumento ? argumento.split(/\s+/) : [];

    // Buscar comando
    let cmd = comandos.get(nombreComando);
    if (!cmd) {
      cmd = [...comandos.values()].find(c => c.alias?.includes(nombreComando));
    }
    if (!cmd) return;

    // Crear contexto
    const context: CommandContext = {
      sock,
      msg,
      args,
      argumento,
      prefijo: PREFIJO,
      fromMe,
      isGroup,
      jid,
      botJid: botJid!,
      responder: crearResponder(sock, msg, jid)
    };

    // Ejecutar comando
    await cmd.ejecutar(context);

  } catch (error) {
    console.error('[HANDLER] Error:', error);
    
    if (!msg.key.fromMe && msg.key.remoteJid) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Error: ${(error as Error).message}`
      }, { quoted: msg });
    }
  }
}

// ============================================================
// HELPER: CREAR RESPONDER
// ============================================================

function crearResponder(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
  jid: string
) {
  return {
    texto: async (text: string) => {
      await sock.sendMessage(jid, { text }, { quoted: msg });
    },
    imagen: async (img: Buffer | string, caption: string = '') => {
      await sock.sendMessage(jid, { image: img as any, caption }, { quoted: msg });
    },
    video: async (vid: Buffer | string, caption: string = '') => {
      await sock.sendMessage(jid, { video: vid as any, caption }, { quoted: msg });
    },
    audio: async (aud: Buffer, ptt: boolean = true) => {
      await sock.sendMessage(jid, {
        audio: aud,
        mimetype: 'audio/mpeg',
        ptt
      }, { quoted: msg });
    }
  };
}