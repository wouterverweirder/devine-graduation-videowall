export const getFilteredDataSource = (data, dataSourceConfig) => {
  let filteredData = [...data];
  dataSourceConfig.filters?.forEach(filter => {
    if (filter.type === 'landscape-images') {
      filteredData = filteredData.filter(asset => {
        const attributes = (asset.attributes) ? asset.attributes : asset;
        return attributes.mime.startsWith('image') && attributes.width > attributes.height;
      });
    } else if (filter.type === 'portrait-images') {
      filteredData = filteredData.filter(asset => {
        const attributes = (asset.attributes) ? asset.attributes : asset;
        return attributes.mime.startsWith('image') && attributes.width < attributes.height;
      });
    } else if (filter.type === 'videos') {
      filteredData = filteredData.filter(asset => {
        const attributes = (asset.attributes) ? asset.attributes : asset;
        return attributes.mime.startsWith('video');
      });
    }
  });
  return filteredData;
};