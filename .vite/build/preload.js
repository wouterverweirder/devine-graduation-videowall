"use strict";
const electron = require("electron");
const VideoWallAPI = {
  processProjects: async (projects, argv) => {
    return electron.ipcRenderer.invoke("process-projects", projects, argv);
  }
};
electron.contextBridge.exposeInMainWorld("VideoWallAPI", VideoWallAPI);
