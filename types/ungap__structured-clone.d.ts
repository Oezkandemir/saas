declare module "@ungap/structured-clone" {
  function structuredClone<T>(value: T, options?: { transfer?: any[] }): T;
  export = structuredClone;
}
