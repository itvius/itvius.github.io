export function getRandomInt(min, max): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


export function getRandomCharacter(r: string = 'QWERTYUIOPLKJHGFDSAZXCVBNM'): string {
  return r[getRandomInt(0, r.length)];
}


export function getRandomBool(v: number = 0.5): boolean {
  return Math.random() > v;
}
