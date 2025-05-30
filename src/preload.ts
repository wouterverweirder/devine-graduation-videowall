import { contextBridge } from 'electron';
import VideoWallAPI from './preload/VideoWallAPI';

contextBridge.exposeInMainWorld('VideoWallAPI', VideoWallAPI);