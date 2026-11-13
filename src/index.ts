import type { DatabaseDriver } from "./DatabaseDriver.js";
import { notConnected } from "./errors.js";

export type PrismaClientLike = {
  $connect?: () => Promise<void>;
  $disconnect?: () => Promise<void>;
};

/**
 * Lifecycle wrapper around a PrismaClient (or generated subclass).
 *
 *   const db = new PrismaAdapter( PrismaClient );
 */
export class PrismaAdapter implements DatabaseDriver<PrismaClientLike> {
  readonly name = "prisma";
  private _client: PrismaClientLike | null = null;
  private _connected = false;

  constructor(private options: new (...args: any[]) => any) {}

  async connect(): Promise<void> {
    if (this._connected && this._client) return;

    this._client = new this.options({
      adapter: config("database.prisma.adapter"),
    });

    await this._client!.$connect?.();

    this._connected = true;
    app().instance("prisma", this._client);
  }

  getConnection(): PrismaClientLike {
    if (!this._client) notConnected(this.name);
    return this._client;
  }

  async disconnect(): Promise<void> {
    if (!this._connected || !this._client) return;
    await this._client.$disconnect?.();
    if (this.options) {
      this._client = null;
    }
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }
}
