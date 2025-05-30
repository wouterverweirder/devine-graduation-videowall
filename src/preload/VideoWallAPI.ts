import { ipcRenderer } from "electron";
import { ArgV } from "../options";

export default {
  processProjects: async (projects:unknown, argv:ArgV) => {
    return ipcRenderer.invoke('process-projects', projects, argv) as Promise<unknown>;
  }
}