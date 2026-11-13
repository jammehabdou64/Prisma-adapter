declare global {
  var config: <T = string>(
    key: string,
    defaultValue?: string | number | boolean,
  ) => T;

  var app: <T = any>(
    obj?: string | (new (...args: any[]) => T),
  ) => T | undefined;
}

export {};
