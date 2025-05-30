export type PromiseWithCancel<T> = Promise<T> & {
  cancel?: () => void;
};

const loadImage = (src:string) => {
  const img = new Image();
  const promise:PromiseWithCancel<HTMLImageElement> = new Promise((resolve, reject) => {
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = err => reject(err);
    img.src = src;
  });
  promise.cancel = () => {
    img.onload = null; // Clear the onload handler
    img.onerror = null; // Clear the onerror handler
    img.src = ""; // Clear the src to stop loading
  };
  return promise;
};

export { loadImage };