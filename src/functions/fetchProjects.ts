import { ApplicationConfig } from "../types";
import { ArgV } from "../options";
import { getExpressURLIfNeeded } from "./getExpressURLIfNeeded";
import { getValueByPath, getValueByPathAdvanced } from "./getValueByPath";

const fetchProjects = async (config: ApplicationConfig, argv:ArgV) => {
  const query = `# Write your query or mutation here
    query{
      students(pagination: { page: 1, pageSize: 100 }){
        data {
          id,
          attributes {
            firstName,
            lastName,
            curriculum {
              data {
                id,
                attributes {
                  name
                  image {
                    data {
                      attributes {
                        url,
                        width,
                        height,
                        mime
                      }
                    }
                  }
                  pillar {
                    data {
                      attributes {
                        name
                        color
                      }
                    }
                  }
                }
              }
            },
            bio,
            experience,
            lifeLesson,
            website,
            quote,
            profilePicture {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            },
            mainAsset {
              data {
                id,
                attributes {
                  url,
                  width,
                  height,
                  mime
                }
              }
            }
          }
        }
      }
    }
  `;
  console.log('frontend-graphql-url', argv['frontend-graphql-url']);
  // always fetch local
  let projectsResult = await (await fetch(getExpressURLIfNeeded(argv['frontend-graphql-url']), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
      },
    }),
  })).json();
  projectsResult = await processProjects(config, projectsResult, argv);
  return projectsResult;
}

const extensionMimeTypes: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
};

export const processProjects = async (config:ApplicationConfig, projectsResult:any, argv:ArgV) => {
  if (window.VideoWallAPI) {
    projectsResult = await window.VideoWallAPI.processProjects(projectsResult, argv);
  }
  const assetKeyNames = Object.keys(config.data.assetKeys);
  const projects = getValueByPath(projectsResult, config.data.projectsKey);
  if (!projects) {
    console.warn(`No projects found at key: ${config.data.projectsKey}`);
    return projectsResult;
  }
  if (!Array.isArray(projects)) {
    console.warn(`Projects at key ${config.data.projectsKey} is not an array`);
    return projectsResult;
  }
  const projectAssetsKeyPrefixToRemove = `${config.data.projectsKey}.[].`;
  // apply the base property of projects if it exists
  for (const project of projects) {
    const hasBaseProperty = Object.prototype.hasOwnProperty.call(project, 'base');
    if (hasBaseProperty && project.base && typeof project.base === 'string') {
      const base:string = project.base;
      for (const assetKeyName of assetKeyNames) {
        const assetKey = config.data.assetKeys[assetKeyName];
        if (assetKey.startsWith(projectAssetsKeyPrefixToRemove)) {
          // remove the prefix from the asset key
          const assetKeyWithoutPrefix = assetKey.replace(projectAssetsKeyPrefixToRemove, '');
          let assetsAdvanced = getValueByPathAdvanced(project, assetKeyWithoutPrefix, project, '');
          if (!assetsAdvanced) {
            console.warn(`No assets found for key: ${assetKeyName} in project`, project);
            continue;
          }
          // set the base property for each asset
          for (const assetAdvanced of assetsAdvanced) {
            let asset = assetAdvanced.value;
            if (asset !== assetAdvanced.parent[assetAdvanced.parentProperty]) {
              console.warn(`Asset ${assetKeyName} is not the same as its parent`, asset, assetAdvanced.parent, assetAdvanced.parentProperty);
              continue;
            }
            if (typeof asset === 'string') {
              // wrap it as an object with url
              asset = assetAdvanced.value = assetAdvanced.parent[assetAdvanced.parentProperty] = {
                url: asset,
              };
            }
            if (typeof asset !== 'object' || !asset) {
              console.warn(`Asset ${assetKeyName} is not an object`, asset);
              continue;
            }
            if (!('url' in asset) || typeof asset.url !== 'string') {
              console.warn(`Asset ${assetKeyName} has no url string property`, asset);
              continue;
            }
            if (!asset.url) {
              console.warn(`Asset ${assetKeyName} has no url`, asset);
              continue;
            }
            if (!(asset.url.startsWith('http://') || asset.url.startsWith('https://'))) {
              // if the url is relative, prepend the base
              asset.url = `${base}/${asset.url}`;
              // console.log(`Updated asset url to ${asset.url}`);
            }
          }
        }
      }
    }
  }
  for (const assetKeyName of assetKeyNames) {
    const assetKey = config.data.assetKeys[assetKeyName];
    let assets = getValueByPath(projectsResult, assetKey);
    console.log(`Processing assets for key: ${assetKeyName}`, assets);
    if (!assets) {
      console.warn(`No assets found for key: ${assetKeyName}`);
      continue;
    }
    if (!Array.isArray(assets)) {
      assets = [assets]; // ensure assets is an array
    }
    if (!Array.isArray(assets)) { // typescript enforcement
      continue; // skip if assets is not an array
    }
    const flattenedAssets = assets.reduce((acc:any, val:any) => acc.concat(val), []).filter((asset:any) => asset !== undefined);
    // set dimensions and mime types if they are not set
    for (const asset of flattenedAssets) {
      if (!asset.url) {
        console.warn(`Asset ${assetKeyName} has no url`, asset);
        continue;
      }
      if (!asset.mime) {
        // deduct it from the url file extension - make sure to ignore query parameters
        const urlParts = asset.url.split('?')[0].split('.');
        const extension = urlParts[urlParts.length - 1];
        if (extensionMimeTypes[extension]) {
          asset.mime = extensionMimeTypes[extension];
        } else {
          console.warn(`Asset ${assetKeyName} has no mime type and could not be deduced from url`, asset);
        }
      }
      const isImage = asset.mime && asset.mime.startsWith('image/');
      if (isImage && (!asset.width || !asset.height)) {
        // fetch the image to get its dimensions
        try {
          const img = new Image();
          img.src = getExpressURLIfNeeded(asset.url);
          await new Promise((resolve, reject) => {
            img.onload = () => {
              asset.width = img.width;
              asset.height = img.height;
              resolve(true);
            };
            img.onerror = reject;
          });
        } catch (error) {
          console.error(`Failed to load image for asset ${assetKeyName}`, error);
        }
      }
    }
  }
  return projectsResult;
}

export {
  fetchProjects
};
