import { DataSourceConfig } from "../types";

type AssetAttributes = {
  mime: string;
  width: number;
  height: number;
};

export const getFilteredDataSource = (data:object[], dataSourceConfig:DataSourceConfig) => {
  let filteredData = [...data];
  if ('filters' in dataSourceConfig) {
    dataSourceConfig.filters?.forEach(filter => {
      if (filter.type === 'landscape-images') {
        filteredData = filteredData.filter(asset => {
          const attributes = ('attributes' in asset) ? asset.attributes as AssetAttributes : asset as AssetAttributes;
          return attributes.mime.startsWith('image') && attributes.width > attributes.height;
        });
      } else if (filter.type === 'portrait-images') {
        filteredData = filteredData.filter(asset => {
          const attributes = ('attributes' in asset) ? asset.attributes as AssetAttributes : asset as AssetAttributes;
          return attributes.mime.startsWith('image') && attributes.width < attributes.height;
        });
      } else if (filter.type === 'videos') {
        filteredData = filteredData.filter(asset => {
          const attributes = ('attributes' in asset) ? asset.attributes as AssetAttributes : asset as AssetAttributes;
          return attributes.mime.startsWith('video');
        });
      }
    });
  }
  return filteredData;
};