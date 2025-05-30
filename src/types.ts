declare global {
  interface Window {
    VideoWallAPI: typeof import("./preload/VideoWallAPI").default;
  }
}

export type ScreenConfig = {
  id: string;
  output: {
    left: number;
    bottom: number;
    width: number;
    height: number;
  };
  camera: {
    size: {
      width: number;
      height: number;
    };
    position: [number, number, number];
    rotation: number;
  };
  roles?: string[];
};

export type DataSourceConfig = {
  key: string;
  flatten?: boolean;
  filters?: {
    type: string;
  }[];
} | {
  url: string;
  mime: string;
}[];

export type SceneObjectConfigScreen = {
  id: string;
  area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type SceneObjectConfig = {
  type: string;
  dataSource?: DataSourceConfig;
  screen?: SceneObjectConfigScreen;
  screens?: SceneObjectConfigScreen[];
};

export type SliderSceneObjectConfig = SceneObjectConfig & {
  item: {
    type: string;
    width: number;
    height: number;
  }
  slideInterval: number;
  slideDelay: number;
  pickingMethod: 'next' | 'random';
}

export function isSliderSceneObjectConfig(config: SceneObjectConfig): config is SliderSceneObjectConfig {
  return config.type === 'slider';
}

export type SceneConfig = {
  objects: SceneObjectConfig[]
  disabled?: boolean;
}

export type ApplicationConfig = {
  scenes: Record<string, SceneConfig>;
  muted?: boolean;
  screens: ScreenConfig[];
  appDimensions: {
    width: number;
    height: number;
  };
  interactionTimeout?: number;
  crop?: number;
  autoNextProjectTimeout?: number;
  data: {
    path: string;
    projectsKey: string;
    assetKeys: Record<string, string>;
    project: Record<string, { key: string }>;
  }
}

export type FetchProjectsResult = unknown;

export type Project = {
  id: string;
};

export type CanvasObject = {
  type: 'text' | 'image' | 'name-background';
  font?: string;
  fillStyle?: string;
  content?: string;
  x?: number;
  y?: number;
  opacity?: number;
  image?: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
  width?: number;
  height?: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
};

export type TextLine = {
  type: 'text';
  font: string;
  fillStyle: string;
  content: string;
  x: number;
  y: number;
  opacity: number;
};