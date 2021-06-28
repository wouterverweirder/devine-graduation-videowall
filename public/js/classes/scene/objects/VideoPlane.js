import { CanvasPlane } from "./CanvasPlane.js";

class VideoPlane extends CanvasPlane {
  async createInitalCanvasContent() {
    console.log(this.props);
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = !(this.props.muted === false);
    video.src = this.props.url;

    const updateVideo = () => {

      const offsetX = (this.canvas.width - video.videoWidth) / 2;
      const offsetY = (this.canvas.height - video.videoHeight) / 2;
      this.ctx.drawImage(video, offsetX, offsetY);

      this.texture.needsUpdate = true;
      video.requestVideoFrameCallback( updateVideo );
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
      video.removeAttribute('src');
      video.load();
    }
    super.dispose();
  }
}

export { VideoPlane }