/**
 * Unified connection lifecycle for any ORM.
 * Query APIs stay on the native client returned by getConnection().
 */
export interface DatabaseDriver<T = unknown> {
  /** Adapter id, e.g. "prisma" or "sequelize". */
  readonly name: string;

  /** Open the underlying client / pool if needed. */
  connect(): Promise<void>;

  /** Native ORM client (PrismaClient, Sequelize, DataSource, …). */
  getConnection(): T;

  /** Close the client and release resources. */
  disconnect(): Promise<void>;

  /** Whether connect() has completed successfully. */
  isConnected(): boolean;
}
