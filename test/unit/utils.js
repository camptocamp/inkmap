export function waitForPromises() {
  jest.useRealTimers();
  return new Promise((resolve) => {
    process.nextTick(resolve);
    jest.useFakeTimers();
  });
}
