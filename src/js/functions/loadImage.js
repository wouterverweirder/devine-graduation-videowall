
const loadImage = (src) => {
  const img = new Image();
  const promise = new Promise((resolve, reject) => {
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
  promise.cancel = () => {
    img.src = "";
  };
  return promise;
};

export { loadImage };