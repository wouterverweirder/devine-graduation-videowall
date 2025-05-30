import { getExpressURLIfNeeded } from "../../../functions/getExpressURLIfNeeded";
import { CanvasPlane } from "./CanvasPlane";
import { VisualBaseProps } from "./VisualBase";

export type VideoPlaneProps = VisualBaseProps & {
  url: string;
  muted?: boolean;
}

class VideoPlane extends CanvasPlane {

  declare props: VideoPlaneProps;

  video: HTMLVideoElement | null = null;
  
  async createInitalCanvasContent() {
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = !(this.props.muted === false);
    video.crossOrigin = "anonymous";
    video.src = getExpressURLIfNeeded(this.props.url);

    const updateVideo = () => {

      const offsetX = (this.canvas.width - video.videoWidth) / 2;
      const offsetY = (this.canvas.height - video.videoHeight) / 2;
      this.ctx.drawImage(video, offsetX, offsetY);

      this.texture.needsUpdate = true;

      if (!this.disposed) {
        video.requestVideoFrameCallback( updateVideo );
      }
    }

    if ( 'requestVideoFrameCallback' in video ) {
      video.requestVideoFrameCallback( updateVideo );
    }

    this.video = video;
  }

  dispose() {
    if (this.video) {
      const video = this.video;
      video.pause();
      video.src = "";
    }
    super.dispose();
  }
}

export { VideoPlane }