import type { Command } from '../../types/command.js';
import os from 'os';
import process from 'process';

// Utilidades de formato
function bold(t: string): string {
  return String(t).replace(/[A-Za-z]/g, c =>
    String.fromCodePoint((c <= 'Z' ? 0x1D400 - 65 : 0x1D41A - 97) + c.charCodeAt(0))
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  
  return parts.join(' ');
}

function getBarraProgreso(porcentaje: number, ancho: number = 10): string {
  const lleno = Math.round((porcentaje / 100) * ancho);
  const vacio = ancho - lleno;
  return '▰'.repeat(lleno) + '▱'.repeat(vacio);
}

const pingCommand: Command = {
  nombre: 'ping',
  categoria: 'utils',
  alias: ['p', 'latencia', 'status', 'info'],
  descripcion: 'Muestra información del sistema y latencia del bot',
  uso: '.ping',
  
  ejecutar: async ({ sock, msg, responder }) => {
    const inicio = Date.now();
    
    // Calcular latencia
    const latencia = Date.now() - inicio;
    
    // Info del sistema
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPorcentaje = (usedMem / totalMem) * 100;
    
    // Construir mensaje con diseño bonito
    const mensaje = 
      '╭━━〔 ⚡ ' + bold('SISTEMA') + ' 〕━━⬣\n' +
      '┃\n' +
      '┃ 🚀 *Velocidad*\n' +
      '┃ ┗━ Latencia: *' + latencia + ' ms*\n' +
      '┃\n' +
      '┃ 📊 *Estado del Bot*\n' +
      '┃ ┗━ Uptime: *' + formatUptime(uptime) + '*\n' +
      '┃ ┗━ Versión: *2.0.0*\n' +
      '┃ ┗━ Plataforma: *' + os.platform() + '*\n' +
      '┃\n' +
      '┃ 💾 *Memoria RAM*\n' +
      '┃ ┗━ Usada: *' + formatBytes(memUsage.heapUsed) + '*\n' +
      '┃ ┗━ Total: *' + formatBytes(memUsage.heapTotal) + '*\n' +
      '┃ ┗━ [' + getBarraProgreso(memPorcentaje) + '] ' + memPorcentaje.toFixed(1) + '%\n' +
      '┃\n' +
      '┃ 🖥️ *Sistema*\n' +
      '┃ ┗━ RAM Total: *' + formatBytes(totalMem) + '*\n' +
      '┃ ┗━ RAM Libre: *' + formatBytes(freeMem) + '*\n' +
      '┃ ┗━ CPU Load: *' + cpuUsage[0].toFixed(2) + '*\n' +
      '┃ ┗━ CPUs: *' + os.cpus().length + ' cores*\n' +
      '┃\n' +
      '┃ 🌐 *Conexión*\n' +
      '┃ ┗━ Node.js: *' + process.version + '*\n' +
      '┃ ┗━ PID: *' + process.pid + '*\n' +
      '┃\n' +
      '╰━━〔 ⚡ 𝐁𝐎𝐓-𝐀𝐏𝐈 ⚡ 〕━━⬣';

    await responder.texto(mensaje);
  }
};

export default pingCommand;