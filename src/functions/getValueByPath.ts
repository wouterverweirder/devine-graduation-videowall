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