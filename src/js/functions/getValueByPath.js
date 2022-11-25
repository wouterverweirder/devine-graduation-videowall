export const getValueByPath = (object, path) => {
  const pathParts = path.split('.');
  let value = object;
  for (let i = 0; i < pathParts.length; i++) {
    const pathPart = pathParts[i];
    if (pathPart === '[]') {
      // return an array of all values
      return value.map((item) => {
        return getValueByPath(item, pathParts.slice(i + 1).join('.'));
      });
    } else {
      value = value[pathPart];
    }
    if (!value) {
      break;
    }
  }
  return value;
};