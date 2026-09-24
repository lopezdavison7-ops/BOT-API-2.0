import { connectToWhatsApp } from './core/connection.js';
import { handleMessage, cargarComandosHandler } from './handler.js';

console.log('🚀 BOT-API v2.0 iniciando...');

async function main() {
  try {
    // Cargar comandos antes de conectar
    const comandos = await cargarComandosHandler();
    console.log(`📦 ${comandos.size} comandos cargados`);

    // Conectar a WhatsApp
    const sock = await connectToWhatsApp();
    
    // Escuchar mensajes
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        try {
          await handleMessage(sock, msg);
        } catch (error) {
          console.error('[MSG] Error procesando:', error);
        }
      }
    });

    // Manejar updates de grupo
    sock.ev.on('group-participants.update', async (update) => {
      console.log('👥 Update grupo:', update.id);
    });

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main();