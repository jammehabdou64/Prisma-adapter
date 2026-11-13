# Prisma Adapter

```bash
# Prisma 7 with driver adapter (e.g. MariaDB / MySQL)
bun add javel-prisma-adapter
bun add -d prisma@7
bun add @prisma/client@7 @prisma/adapter-mariadb mariadb
```

## Prisma setup

### 1. Initialize Prisma

Initialize Prisma with your datasource provider and output path:

```bash
bunx prisma init --datasource-provider mysql --output ./generated/prisma
```

This creates `prisma7.config.ts` and a `prisma/` folder with `schema.prisma`. In `prisma/schema.prisma`, your generator should look like this:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

### 2. Configure path alias in `tsconfig.json`

Add the generated path alias to `compilerOptions.paths` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "generated/*": ["./generated/*"]
    }
  }
}
```

This allows importing the generated client cleanly from anywhere:

```typescript
import { PrismaClient } from "generated/prisma/client";
```

### 3. Configure the adapter in `config/database.ts`

When using Prisma 7 with driver adapters (e.g. MariaDB/MySQL, PostgreSQL), configure the adapter in `config/database.ts`. Since configuration is loaded before providers register, it is immediately available when the framework boots:

```typescript
// config/database.ts
import { env } from "javel-jcc/helpers";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export const database = {
  default: env("DB_CONNECTION", "sqlite"),

  // ... other connection configs ...

  prisma: {
    adapter: new PrismaMariaDb({
      user: env("DB_USERNAME", "root") as string,
      password: env("DB_PASSWORD", "password") as string,
      database: env("DB_DATABASE", "app_database") as string,
      host: env("DB_HOST", "localhost") as string,
      port: Number(env("DB_PORT", 3306)),
    }),
  },
};
```

### 4. Boot in a provider

Pass your generated `PrismaClient` class to `new PrismaAdapter(PrismaClient)`. On `connect()`, the adapter automatically instantiates the client with `{ adapter: config("database.prisma.adapter") }` and registers the singleton on `app().instance("prisma", ...)`:

```typescript
// app/Providers/PrismaServiceProvider.ts
import { ServiceProvider } from "javel-jcc/Providers/ServiceProvider";
import { PrismaAdapter } from "javel-prisma-adapter";
import { PrismaClient } from "generated/prisma/client";

export class PrismaServiceProvider extends ServiceProvider {
  private _db = new PrismaAdapter(PrismaClient);

  async register() {}

  async boot() {
    await this._db.connect();
  }
}
```

Register it in `app/bootstrap/providers.ts`:

```typescript
import { AppServiceProvider } from "@Providers/AppServiceProvider";
import { RouteServiceProvider } from "@Providers/RouteServiceProvider";
import { PrismaServiceProvider } from "@Providers/PrismaServiceProvider";

export const providers = [
  AppServiceProvider,
  PrismaServiceProvider,
  RouteServiceProvider,
];
```

### 5. Use in your application

**Via `app("prisma")`:**

```typescript
import { PrismaClient } from "generated/prisma/client";

const prisma = app<PrismaClient>("prisma");
const users = await prisma.user.findMany();
```

**Via Injectable `PrismaService` in Controllers:**

You can create an injectable service extending `PrismaClient`:

```typescript
// app/Services/PrismaService.ts
import { Inject } from "javel-jcc";
import { PrismaClient } from "generated/prisma/client";

@Inject()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      adapter: config("database.prisma.adapter"),
    });
  }
}
```

And inject it directly into controller constructors:

```typescript
// app/Http/Controllers/UserController.ts
import { Controller } from "javel-jcc/Routing/Controller";
import { Action, Inject } from "javel-jcc";
import { PrismaService } from "../../Services/PrismaService";

@Inject()
export class UserController extends Controller {
  constructor(private prisma: PrismaService) {
    super();
  }

  @Action()
  async index() {
    const users = await this.prisma.user.findMany();
    return { users };
  }
}
```
