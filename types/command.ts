import type { WASocket, proto } from 'baileys';

export interface CommandResponder {
  texto: (text: string) => Promise<void>;
  imagen: (img: Buffer | string, caption?: string) => Promise<void>;
  video: (vid: Buffer | string, caption?: string) => Promise<void>;
  audio: (aud: Buffer, ptt?: boolean) => Promise<void>;
}

export interface CommandContext {
  sock: WASocket;
  msg: proto.IWebMessageInfo;
  args: string[];
  argumento: string;
  prefijo: string;
  fromMe: boolean;
  isGroup: boolean;
  jid: string;
  botJid: string;
  responder: CommandResponder;
}

export interface Command {
  nombre: string;
  categoria: string;
  alias?: string[];
  descripcion: string;
  uso: string;
  nsfw?: boolean;
  ejecutar: (ctx: CommandContext) => Promise<void>;
}

export type CommandMap = Map<string, Command>;