import { connectToWhatsApp } from './core/connection.js';
import { handleMessage } from './handler.js';

console.log('🚀 Bot-API v2.0 iniciando...');

async function main() {
  try {
    const sock = await connectToWhatsApp();
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        if (!msg.message) continue;
        await handleMessage(sock, msg);
      }
    });

    console.log('✅ Bot conectado y escuchando mensajes');
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main();