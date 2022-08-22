const { contextBridge } = require('electron');
const util = require('util');
const path = require('path');
const fs = require('fs');

contextBridge.exposeInMainWorld('VideoWallAPI', {
  processProjects: async (projects, argv) => {
    console.log('process projects called');
    console.log(projects);
    console.log(argv);
    const uploadsPath = path.resolve(__dirname, '..', 'public', 'uploads');
    // create the uploadsPath folder async if it doesn't exist
    await util.promisify(fs.mkdir)(uploadsPath, { recursive: true });

    for (const student of projects.data.students.data) {
      if (student.attributes.profilePicture.data) {
        const profilePicture = student.attributes.profilePicture.data.attributes;
        await updateUrlToLocalFileIfNeeded(profilePicture, uploadsPath);
      }
      if (student.attributes.curriculum.data?.attributes.image.data) {
        const image = student.attributes.curriculum.data.attributes.image.data.attributes;
        await updateUrlToLocalFileIfNeeded(image, uploadsPath);
      }
    }
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