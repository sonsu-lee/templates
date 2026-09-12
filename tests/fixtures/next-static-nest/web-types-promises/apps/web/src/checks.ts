export const count: number = 'wrong';
async function work(): Promise<void> { await Promise.resolve(); }
work();
export const unsafeValue = JSON.parse('{}');
if (work()) console.log('promise condition');
