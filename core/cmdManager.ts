import type { Command, CommandMap } from '../types/command.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const CMD_DIR = path.join(process.cwd(), 'cmd');

export async function loadCommands(): Promise<CommandMap> {
  const commands: CommandMap = new Map();

  async function cargarCarpeta(dirPath: string) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        await cargarCarpeta(fullPath);
      } else if (item.name.endsWith('.ts') || item.name.endsWith('.js')) {
        try {
          const fileUrl = pathToFileURL(fullPath).href;
          const modulo = await import(fileUrl);
          const cmd: Command = modulo.default;

          if (cmd && cmd.nombre && typeof cmd.ejecutar === 'function') {
            commands.set(cmd.nombre.toLowerCase(), cmd);

            if (cmd.alias && Array.isArray(cmd.alias)) {
              for (const alias of cmd.alias) {
                commands.set(alias.toLowerCase(), cmd);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error cargando ${fullPath}:`, (error as Error).message);
        }
      }
    }
  }

  if (fs.existsSync(CMD_DIR)) {
    await cargarCarpeta(CMD_DIR);
  }

  return commands;
}