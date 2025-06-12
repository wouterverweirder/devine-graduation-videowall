export const getValueByPath = (object:unknown, path:string):unknown => {
  if (path === '') {
    return object;
  }
  const pathParts = path.split('.');
  let value = object;
  for (let i = 0; i < pathParts.length; i++) {
    const pathPart = pathParts[i];
    if (pathPart === '[]' && Array.isArray(value)) {
      // return an array of all values
      return value.map((item) => {
        return getValueByPath(item, pathParts.slice(i + 1).join('.'));
      });
    } else {
      const valueIsObject = typeof value === 'object' && value !== null;
      if (valueIsObject && pathPart in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[pathPart];
      } else {
        value = undefined;
      }
    }
    if (!value) {
      break;
    }
  }
  return value;
};

type ParentType = Record<string | number | symbol, unknown>;
type ParentPropertyType = string | number | symbol;

export const expandNestedValue = (input:{ parent: ParentType, parentProperty: ParentPropertyType, value: unknown }[]):{ parent: ParentType, parentProperty: ParentPropertyType, value: unknown }[] => {
  const result:{ parent: ParentType, parentProperty: ParentPropertyType, value: unknown }[] = [];
  for (const item of input) {
    if (Array.isArray(item.value)) {
      // if the value is an array, expand it
      for (const valueItem of item.value) {
        if (Array.isArray(valueItem)) {
          // if the value item is an array, expand it recursively
          result.push(...expandNestedValue(valueItem));
        } else {
          result.push({
            parent: item.parent,
            parentProperty: item.parentProperty,
            value: valueItem
          });
        }
      }
    } else {
      result.push(item);
    }
  }
  return result;
};

export const getValueByPathAdvanced = (object:unknown, path:string, parent: ParentType, parentProperty: ParentPropertyType):{ parent: ParentType, parentProperty: ParentPropertyType, value: unknown }[] => {
  if (path === '') {
    return expandNestedValue([{
      parent,
      parentProperty,
      value: object
    }]);
  }
  const pathParts = path.split('.');
  let value = object;
  for (let i = 0; i < pathParts.length; i++) {
    const pathPart = pathParts[i];
    if (pathPart === '[]' && Array.isArray(value)) {
      // return an array of all values
      return expandNestedValue([{
        parent,
        parentProperty,
        value: value.map((item, index) => {
          return getValueByPathAdvanced(item, pathParts.slice(i + 1).join('.'), value as Record<string, unknown>, index);
        })
      }]);
    } else {
      const valueIsObject = typeof value === 'object' && value !== null;
      if (valueIsObject && pathPart in (value as Record<string, unknown>)) {
        parent = value as Record<string, unknown>;
        parentProperty = pathPart;
        value = (value as Record<string, unknown>)[pathPart];
      } else {
        value = undefined;
      }
    }
    if (!value) {
      break;
    }
  }
  return expandNestedValue([{
    parent,
    parentProperty,
    value
  }]);
}