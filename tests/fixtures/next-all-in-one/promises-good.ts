export async function handledPromises(): Promise<void> {
  await Promise.resolve(1);
  if (await Promise.resolve(true)) {
    console.log("The resolved value is true");
  }
}
