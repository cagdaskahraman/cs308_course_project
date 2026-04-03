/** Postgres `numeric` / `decimal` değerlerini uygulamada `number` olarak kullanır. */
export const decimalNumberTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};
