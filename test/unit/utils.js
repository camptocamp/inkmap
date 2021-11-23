export function waitForPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}
