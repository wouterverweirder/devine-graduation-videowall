const { contextBridge } = require('electron');
const util = require('util');
const path = require('path');
const fs = require('fs');
const readFilePromised = util.promisify(fs.readFile);
const configJSONPath = path.resolve(__dirname, '..', 'public', 'config.json');

const getValueByPath = (object, path) => {
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

contextBridge.exposeInMainWorld('VideoWallAPI', {
  processProjects: async (projects, argv) => {
    console.log('process projects called');
    console.log(projects);
    console.log(argv);

    const uploadsPath = path.resolve(__dirname, '..', 'public', 'uploads');
    // create the uploadsPath folder async if it doesn't exist
    await util.promisify(fs.mkdir)(uploadsPath, { recursive: true });

    const config = JSON.parse(await readFilePromised(configJSONPath, 'utf8'));
    const assetKeyNames = Object.keys(config.data.assetKeys);
    for (const assetKeyName of assetKeyNames) {
      const assets = getValueByPath(projects, config.data.assetKeys[assetKeyName]);
      console.log(assetKeyName, assets);
      const flattenedAssets = assets.reduce((acc, val) => acc.concat(val), []);
      for (const asset of flattenedAssets) {
        await updateUrlToLocalFileIfNeeded(asset, uploadsPath);
      }
    }
    console.log('processed');
    console.log(projects);
    return projects;
  }
})

const updateUrlToLocalFileIfNeeded = async (objectWithUrlProperty, uploadsPath) => {
  if (objectWithUrlProperty.url.match(/^https?:\/\//)) {
    // get the filename from the objectWithUrlProperty.url
    const filename = objectWithUrlProperty.url.split('/').pop();
    // check async if the filename exists in the uploadsPath
    const exists = await util.promisify(fs.exists)(path.resolve(uploadsPath, filename));
    if (!exists) {
      console.log(`download ${objectWithUrlProperty.url} to ${uploadsPath}`);
      // download the binary objectWithUrlProperty.url to the uploadsPath async
      const response = await fetch(objectWithUrlProperty.url);
      const buffer = await response.arrayBuffer();
      // write the array buffer to a file async
      await util.promisify(fs.writeFile)(path.resolve(uploadsPath, filename), Buffer.from(buffer));
    }
    // update the url to the local url
    objectWithUrlProperty.url = `http://127.0.0.1/uploads/${filename}`;
  }
}