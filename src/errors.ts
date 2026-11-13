export class OrmAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrmAdapterError";
  }
}

export function missingPeer(orm: string, packages: string[]): never {
  throw new OrmAdapterError(
    `${orm} adapter requires: bun add ${packages.join(" ")}`,
  );
}

export function notConnected(orm: string): never {
  throw new OrmAdapterError(
    `${orm} is not connected. Call connect() first.`,
  );
}
