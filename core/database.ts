import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'database');

// Crear carpeta si no existe
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export function leerJSON<T>(archivo: string, defaultVal: T): T {
  const ruta = path.join(DB_DIR, archivo);
  try {
    if (!fs.existsSync(ruta)) {
      fs.writeFileSync(ruta, JSON.stringify(defaultVal, null, 2), 'utf8');
      return defaultVal;
    }
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch {
    return defaultVal;
  }
}

export function escribirJSON<T>(archivo: string, data: T): void {
  const ruta = path.join(DB_DIR, archivo);
  fs.writeFileSync(ruta, JSON.stringify(data, null, 2), 'utf8');
}

// Economy helpers
export interface UsuarioEconomia {
  dinero: number;
  banco: number;
  nombre?: string;
  ultimoDaily?: number;
  ultimoWeekly?: number;
}

export function getUsuario(jid: string): UsuarioEconomia {
  const db = leerJSON<Record<string, UsuarioEconomia>>('economia.json', {});
  return db[jid] || { dinero: 0, banco: 0 };
}

export function setUsuario(jid: string, data: UsuarioEconomia): void {
  const db = leerJSON<Record<string, UsuarioEconomia>>('economia.json', {});
  db[jid] = data;
  escribirJSON('economia.json', db);
}

export function modificarDinero(jid: string, cantidad: number): UsuarioEconomia {
  const usuario = getUsuario(jid);
  usuario.dinero += cantidad;
  if (usuario.dinero < 0) usuario.dinero = 0;
  setUsuario(jid, usuario);
  return usuario;
}