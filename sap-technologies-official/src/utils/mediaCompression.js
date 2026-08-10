const compressibleTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BACKGROUND_CLEANUP_SIZE = 1400;

const loadImage = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error(`Unable to read image "${file.name}"`));
  };

  image.src = objectUrl;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality);
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getPixelIndex = (x, y, width) => (y * width + x) * 4;

const colorDistance = (data, index, color) => {
  const red = data[index] - color.red;
  const green = data[index + 1] - color.green;
  const blue = data[index + 2] - color.blue;

  return Math.sqrt((red * red * 0.3) + (green * green * 0.59) + (blue * blue * 0.11));
};

const getPixelDistance = (data, firstIndex, secondIndex) => {
  const red = data[firstIndex] - data[secondIndex];
  const green = data[firstIndex + 1] - data[secondIndex + 1];
  const blue = data[firstIndex + 2] - data[secondIndex + 2];

  return Math.sqrt((red * red * 0.3) + (green * green * 0.59) + (blue * blue * 0.11));
};

const estimateBackground = (data, width, height) => {
  const samples = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 36));

  for (let x = 0; x < width; x += step) {
    samples.push(getPixelIndex(x, 0, width));
    samples.push(getPixelIndex(x, height - 1, width));
  }

  for (let y = 0; y < height; y += step) {
    samples.push(getPixelIndex(0, y, width));
    samples.push(getPixelIndex(width - 1, y, width));
  }

  const average = samples.reduce((color, index) => ({
    red: color.red + data[index],
    green: color.green + data[index + 1],
    blue: color.blue + data[index + 2]
  }), { red: 0, green: 0, blue: 0 });

  const background = {
    red: average.red / samples.length,
    green: average.green / samples.length,
    blue: average.blue / samples.length
  };

  const variance = samples.reduce((total, index) => (
    total + colorDistance(data, index, background)
  ), 0) / samples.length;

  return {
    color: background,
    tolerance: clamp(42 + variance * 0.45, 48, 86)
  };
};

export const removeConnectedBackgroundToWhite = async (file) => {
  if (typeof window === "undefined" || !file?.type?.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_BACKGROUND_CLEANUP_SIZE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return file;

  canvas.width = width;
  canvas.height = height;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const { color: backgroundColor, tolerance } = estimateBackground(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue = [];

  const trySeed = (x, y) => {
    const position = y * width + x;
    const index = getPixelIndex(x, y, width);

    if (!visited[position] && colorDistance(data, index, backgroundColor) <= tolerance + 18) {
      visited[position] = 1;
      queue.push(position);
    }
  };

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const position = queue[cursor];
    const x = position % width;
    const y = Math.floor(position / width);
    const currentIndex = position * 4;
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];

    neighbors.forEach(([nextX, nextY]) => {
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) return;

      const nextPosition = nextY * width + nextX;
      if (visited[nextPosition]) return;

      const nextIndex = nextPosition * 4;
      const backgroundDistance = colorDistance(data, nextIndex, backgroundColor);
      const localDistance = getPixelDistance(data, nextIndex, currentIndex);

      if (
        backgroundDistance <= tolerance ||
        (backgroundDistance <= tolerance + 22 && localDistance <= 26)
      ) {
        visited[nextPosition] = 1;
        queue.push(nextPosition);
      }
    });
  }

  for (let position = 0; position < visited.length; position += 1) {
    if (!visited[position]) continue;

    const index = position * 4;
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "product-image";
  return new File([blob], `${baseName}-white-bg.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
};

export const compressImageFile = async (file, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    minBytes = 450 * 1024,
  } = options;

  if (
    typeof window === "undefined" ||
    !file?.type?.startsWith("image/") ||
    !compressibleTypes.has(file.type) ||
    file.size < minBytes
  ) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
  let blob = await canvasToBlob(canvas, outputType, quality);

  if (!blob && outputType !== "image/jpeg") {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");

  return new File([blob], `${baseName}-optimized.${extension}`, {
    type: blob.type || outputType,
    lastModified: Date.now(),
  });
};

export const compressImageFiles = (files, options) => (
  Promise.all(files.map((file) => compressImageFile(file, options)))
);
