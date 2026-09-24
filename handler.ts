import type { WASocket, proto } from 'baileys';
import type { Command, CommandContext, CommandMap } from './types/command.js';
import { loadCommands } from './core/cmdManager.js';
import fs from 'fs';
import path from 'path';

const PREFIJO = '.';

let comandos: CommandMap | null = null;
let botJid: string | null = null;

export async function cargarComandosHandler(): Promise<CommandMap> {
  if (!comandos) {
    comandos = await loadCommands();
    console.log(`[HANDLER] ✅ Comandos cargados: ${comandos.size}`);
  }
  return comandos;
}

export async function handleMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo
): Promise<void> {
  try {
    if (!comandos) {
      comandos = await loadCommands();
    }

    if (!botJid) botJid = sock.user!.id;
    if (!msg.message) return;
    if (msg.key.remoteJid === 'status@broadcast') return;

    const jid = msg.key.remoteJid!;
    const fromMe = msg.key.fromMe || false;
    const isGroup = jid?.endsWith('@g.us') || false;

    // Extraer texto
    const texto = msg.message?.conversation || 
                  msg.message?.extendedTextMessage?.text || '';

    if (!texto.startsWith(PREFIJO)) return;

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

    // Ejecutar
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
      responder: {
        texto: async (text) => {
          await sock.sendMessage(jid, { text }, { quoted: msg });
        },
        imagen: async (img, caption = '') => {
          await sock.sendMessage(jid, { image: img as any, caption }, { quoted: msg });
        },
        video: async (vid, caption = '') => {
          await sock.sendMessage(jid, { video: vid as any, caption }, { quoted: msg });
        },
        audio: async (aud, ptt = true) => {
          await sock.sendMessage(jid, {
            audio: aud,
            mimetype: 'audio/mpeg',
            ptt
          }, { quoted: msg });
        }
      }
    };

    await cmd.ejecutar(context);

  } catch (error) {
    console.error('[HANDLER] Error:', error);
    if (!msg.key.fromMe) {
      await sock.sendMessage(msg.key.remoteJid!, {
        text: `❌ Error: ${(error as Error).message}`
      }, { quoted: msg });
    }
  }
}