export const normaliseMacAddress = (macAddress: string): string => macAddress.replace(/:/g, "").toUpperCase();

export const split = <T>(
  items: T[],
  splitFn: (item: T) => boolean,
): [arrayItemsWhereSplitFnReturnedTrue: T[], arrayItemsWhereSplitFnReturnedFalse: T[]] => {
  return items.reduce(
    (accumulator, element) => {
      const [truthyItems, falseyItems] = accumulator;

      if (splitFn(element)) {
        return [[...truthyItems, element], falseyItems];
      } else {
        return [truthyItems, [...falseyItems, element]];
      }
    },
    [[], []] as [arrayItemsWhereSplitFnReturnedTrue: T[], arrayItemsWhereSplitFnReturnedFalse: T[]]
  ) as [arrayItemsWhereSplitFnReturnedTrue: T[], arrayItemsWhereSplitFnReturnedFalse: T[]];
};
