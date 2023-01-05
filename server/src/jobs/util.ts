export function runSafely(f: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await f();
    } catch (error) {
      console.log(error);
    }
  };
}
