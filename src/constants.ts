/** The different categories of data supported, represented by the plugin's tabs. */
export enum CategoryType {
  WEBDATA = 'webdata',
  CATALOGUE = 'catalogue',
  MYDATA = 'mydata',
  ADDED = 'added',
}

/** Return a type of the parameters filtering its readonly properties */
export type WritableKeys<T> = Pick<
  T,
  {
    [P in keyof T]-?: (<U>() => U extends { [Q in P]: T[P] } ? 1 : 2) extends <
      U,
    >() => U extends { -readonly [Q in P]: T[P] } ? 1 : 2
      ? P
      : never;
  }[keyof T]
>;
