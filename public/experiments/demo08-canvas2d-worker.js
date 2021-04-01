const balls = [
  {
    x: 0,
    y: 0,
    velocityX: 10,
    velocityY: 10
  }
];

let outputCanvas, editorCanvas, appDimensions, sourceDimensions, screens;
let screensById = {};
let sourceCanvas, sourceCtx, outputCtx, editorCtx;

const init = () => {
  let lastCalledTime = 0;

  screens.forEach(screen => screensById[screen.id] = screen);

  // add some random balls

  for (let i = 0; i < 10; i++) {
    balls.push({
      x: Math.random() * sourceDimensions.width,
      y: Math.random() * sourceDimensions.height,
      velocityX: 10,
      velocityY: 10
    });
  }
  
  sourceCanvas = new OffscreenCanvas(sourceDimensions.width, sourceDimensions.height);
  sourceCtx = sourceCanvas.getContext('2d');
  outputCtx = outputCanvas.getContext('2d');
  editorCtx = editorCanvas.getContext('2d');

  const render = (time) => {

    delta = (time - lastCalledTime) * 0.001;
    lastCalledTime = time;
    fps = 1/delta;

    console.log(Math.round(fps));

    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    balls.forEach(ball => {
      ball.x += ball.velocityX;
      ball.y += ball.velocityY;

      if (ball.x > sourceDimensions.width) {
        ball.velocityX = -Math.abs(ball.velocityX);
      } else if (ball.x < 0) {
        ball.velocityX = Math.abs(ball.velocityX);
      }

      if (ball.y > sourceDimensions.height) {
        ball.velocityY = -Math.abs(ball.velocityY);
      } else if (ball.y < 0) {
        ball.velocityY = Math.abs(ball.velocityY);
      }

      sourceCtx.save();
      sourceCtx.fillStyle = 'red';
      sourceCtx.beginPath();
      sourceCtx.ellipse(ball.x, ball.y, 100, 100, 0, 0, Math.PI * 2);
      sourceCtx.closePath();
      sourceCtx.fill();
      sourceCtx.restore();
    });

    editorCtx.drawImage(sourceCanvas, 0, 0);
    // draw the screen positions
    screens.forEach(screen => {
      editorCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      editorCtx.strokeStyle = 'black';
      editorCtx.lineWidth = 5;
      editorCtx.strokeRect(screen.x, screen.y, screen.width, screen.height);
    });

    // draw the screen positions
    screens.forEach(screen => {
      const outputX = (screen.id % appDimensions.cols) * appDimensions.screenWidth;
      const outputY = Math.floor(screen.id / appDimensions.cols) * appDimensions.screenHeight;
      outputCtx.drawImage(sourceCanvas, screen.x, screen.y, screen.width, screen.height, outputX, outputY, appDimensions.screenWidth, appDimensions.screenHeight);
    });

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

onmessage = function (event) {

  if (event.data.type === "init") {
    outputCanvas = event.data.outputCanvas;
    editorCanvas = event.data.editorCanvas;
    appDimensions = event.data.appDimensions;
    sourceDimensions = event.data.sourceDimensions;
    screens = event.data.screens;

    init();
  } else if (event.data.type === "updateScreen") {
    const screen = screensById[event.data.screen.id];
    screen.x = event.data.screen.x;
    screen.y = event.data.screen.y;
    screen.width = event.data.screen.width;
    screen.height = event.data.screen.height;
  }
  
};