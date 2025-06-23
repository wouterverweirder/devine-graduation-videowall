import { ipcRenderer } from "electron";
import { ArgV } from "../options";

export default {
  startServer: async (argv: ArgV) => {
    return ipcRenderer.invoke('start-server', argv) as Promise<boolean>;
  },
  selectDirectory: async () => {
    return ipcRenderer.invoke('select-directory') as Promise<string>;
  },
  processProjects: async (projects:unknown, argv:ArgV) => {
    return ipcRenderer.invoke('process-projects', projects, argv) as Promise<unknown>;
  }
}