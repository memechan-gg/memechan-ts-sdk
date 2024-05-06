export const chunkedRequests = async <T>(ids: string[], func: (ids: string[]) => Promise<T[]>): Promise<T[]> => {
  const chunkSize = 50;
  const result: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const resultItems = await func(chunk);
    result.push(...resultItems);
  }
  return result;
};
