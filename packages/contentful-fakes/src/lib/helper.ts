export const oneOf = <T = string>(array: T[] = []): T => {
  const index = randomInt(0, array.length);

  return array[index];
};

export const randomInt = (min = 0, max = 1000000) => {
  min = Math.ceil(min || 0);
  max = Math.floor(max || 1000000);
  return Math.floor(Math.random() * (max - min)) + min;
};
