export function unsafeReturn(value: any): string {
  const item: string = value.name;
  value();
  return value || item;
}
