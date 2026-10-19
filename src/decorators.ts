/**
 * Legacy TypeScript method decorators.
 * Enable "experimentalDecorators": true in tsconfig.json.
 */
export function Log(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

  descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
    console.log(`[CALL] ${String(propertyKey)}`, args);

    try {
      const result = originalMethod.apply(this, args);
      console.log(`[RETURN] ${String(propertyKey)}`, result);
      return result;
    } catch (error: unknown) {
      console.error(`[ERROR] ${String(propertyKey)}`, error);
      throw error;
    }
  };
}

export function MeasureTime(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

  descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
    const start = Date.now();

    try {
      return originalMethod.apply(this, args);
    } finally {
      console.log(`[TIME] ${String(propertyKey)}: ${Date.now() - start} ms`);
    }
  };
}

// Exercice 4 : refuse un sort dont la puissance est négative
export function ValidateSpellPower(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

  descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
    const candidate: unknown = args[0];

    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "power" in candidate &&
      typeof candidate.power === "number" &&
      candidate.power < 0
    ) {
      throw new Error("Spell power cannot be negative");
    }

    return originalMethod.apply(this, args);
  };
}

// Exercice 5 : met en cache les résultats (un cache séparé par instance)
export function Cache(
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

  const instanceCaches = new WeakMap<object, Map<string, unknown>>();

  descriptor.value = function (this: object, ...args: unknown[]): unknown {
    let cache = instanceCaches.get(this);
    if (!cache) {
      cache = new Map<string, unknown>();
      instanceCaches.set(this, cache);
    }

    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`[CACHE HIT] ${String(propertyKey)}`);
      return cache.get(key);
    }

    console.log(`[CACHE MISS] ${String(propertyKey)}`);
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };
}