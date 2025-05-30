import { ArgV } from '../options';


export const processProjects = async (projects:unknown, argv:ArgV) => {
  console.log('process projects called');
  console.log(projects);
  console.log(argv);

  // const configJSONPath = path.resolve(argv['projectDirectory'], argv['config-json-path']);

  // // const uploadsPath = path.resolve(__dirname, '..', 'public', 'uploads');
  // // // create the uploadsPath folder async if it doesn't exist
  // // await mkdir(uploadsPath, { recursive: true });

  // const config = JSON.parse(await readFile(configJSONPath, 'utf8'));
  // const assetKeyNames = Object.keys(config.data.assetKeys);
  // for (const assetKeyName of assetKeyNames) {
  //   const assets = getValueByPath(projects, config.data.assetKeys[assetKeyName]);
  //   console.log(assetKeyName, config.data.assetKeys[assetKeyName], assets);
  //   if (!assets) {
  //     console.warn(`No assets found for key: ${assetKeyName}`);
  //     continue;
  //   }
  //   if (!Array.isArray(assets)) {
  //     console.warn(`Assets for key ${assetKeyName} is not an array`);
  //     continue;
  //   }
  //   const flattenedAssets = assets.reduce((acc, val) => acc.concat(val), []);
  //   for (const asset of flattenedAssets) {
  //     const assetUrlHasNoProtocol = asset.url && !asset.url.match(/^https?:\/\//);
  //     console.log(`Processing asset: ${assetKeyName}`, assetUrlHasNoProtocol, asset);
  //     if (assetUrlHasNoProtocol) {
  //       // route through the express server
  //       asset.url = `http://127.0.0.1/${asset.url}`;
  //     }
  //     // await updateUrlToLocalFileIfNeeded(asset, uploadsPath);
  //   }
  // }
  return projects;
}

// const updateUrlToLocalFileIfNeeded = async (objectWithUrlProperty: { url: string }, uploadsPath: string) => {
//   if (objectWithUrlProperty.url.match(/^https?:\/\//)) {
//     // get the filename from the objectWithUrlProperty.url
//     const filename = objectWithUrlProperty.url.split('/').pop();
//     // check async if the filename exists in the uploadsPath
//     const exists = await stat(path.resolve(uploadsPath, filename));
//     if (!exists) {
//       console.log(`download ${objectWithUrlProperty.url} to ${uploadsPath}`);
//       // download the binary objectWithUrlProperty.url to the uploadsPath async
//       const response = await fetch(objectWithUrlProperty.url);
//       const buffer = await response.arrayBuffer();
//       // write the array buffer to a file async
//       await writeFile(path.resolve(uploadsPath, filename), Buffer.from(buffer));
//     }
//     // update the url to the local url
//     objectWithUrlProperty.url = `http://127.0.0.1/uploads/${filename}`;
//   }
// }