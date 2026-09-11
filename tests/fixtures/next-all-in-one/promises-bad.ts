export function unsafePromises() {
  Promise.resolve(1);
  if (Promise.resolve(true)) {
    console.log("A Promise is always truthy");
  }
}
