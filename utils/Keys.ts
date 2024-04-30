/**
 * Get the keys of an object
 * @param object
 */
export default function getKeys<T extends object>(object: T) {
  return Object.keys(object).map((key) => key as keyof T)
}
