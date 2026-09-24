import { makeWASocket, DisconnectReason, useMultiFileAuthState } from 'baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';

const SESSION_DIR = path.join(process.cwd(), 'sessions');

export async function connectToWhatsApp() {
  // Crear carpeta de sesiones si no existe
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true,
    browser: ['BOT-API 2.0', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconectando...');
        setTimeout(() => connectToWhatsApp(), 3000);
      } else {
        console.log('❌ Sesión cerrada, escanea QR de nuevo');
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        setTimeout(() => connectToWhatsApp(), 3000);
      }
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado exitosamente');
      console.log(`📱 Usuario: ${sock.user?.name || 'Bot'}`);
    }
  });

  return sock;
}