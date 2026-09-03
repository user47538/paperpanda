import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const sourceDirectory = "/Users/amywoolley/Downloads";
const outputDirectory = new URL("../public/property/horses/", import.meta.url);
const outputDirectoryPath = fileURLToPath(outputDirectory);
const horseNumbers = [2, ...Array.from({ length: 12 }, (_, index) => index + 11)];
const variants = [
  { suffix: "", source: (number) => `Horse${number}.png` },
  { suffix: "-saddle", source: (number) => `Horse${number} saddle.jpeg` },
  { suffix: "-bridle", source: (number) => `Horse${number} bridle.jpeg` }
];

function colorDistance(red, green, blue, sample) {
  return Math.max(
    Math.abs(red - sample[0]),
    Math.abs(green - sample[1]),
    Math.abs(blue - sample[2])
  );
}

function collectBackgroundSamples(data, width, height) {
  const samples = [];
  const addSample = (x, y) => {
    const offset = (y * width + x) * 4;
    const sample = [data[offset], data[offset + 1], data[offset + 2]];
    if (!samples.some((existing) => colorDistance(...sample, existing) < 16)) {
      samples.push(sample);
    }
  };

  for (let x = 0; x < width; x += 24) {
    addSample(x, 0);
    addSample(x, height - 1);
  }
  for (let y = 0; y < height; y += 24) {
    addSample(0, y);
    addSample(width - 1, y);
  }
  return samples;
}

function removeConnectedBackground(imageData, extraSeeds = []) {
  const { data, width, height } = imageData;
  const samples = collectBackgroundSamples(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  extraSeeds.forEach(({ x, y }) => enqueue(x, y));

  while (head < tail) {
    const index = queue[head++];
    const offset = index * 4;
    const isBackground = samples.some((sample) => colorDistance(data[offset], data[offset + 1], data[offset + 2], sample) <= 36);
    if (!isBackground) continue;
    data[offset + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
}

function removeCheckerboardInsideReins(imageData) {
  const { data, width, height } = imageData;
  const samples = collectBackgroundSamples(data, width, height);
  const xStart = Math.round(width * 0.64);
  const xEnd = Math.round(width * 0.9);
  const yStart = Math.round(height * 0.2);
  const yEnd = Math.round(height * 0.46);
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * width + x) * 4;
      if (samples.some((sample) => colorDistance(data[offset], data[offset + 1], data[offset + 2], sample) <= 8)) {
        data[offset + 3] = 0;
      }
    }
  }
}

function cropTransparentCanvas(canvas) {
  const context = canvas.getContext("2d");
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return canvas;
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const cropped = createCanvas(maxX - minX + 1, maxY - minY + 1);
  cropped.getContext("2d").drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}

async function makeTransparentHorseAsset(number, variant) {
  const sourcePath = join(sourceDirectory, variant.source(number));
  const source = await loadImage(await readFile(sourcePath));
  const canvas = createCanvas(source.width, source.height);
  const context = canvas.getContext("2d");
  context.drawImage(source, 0, 0);

  if (number === 2) {
    // The supplied Horse 2 images include an unrelated camera badge in this corner.
    context.clearRect(0, Math.round(source.height * 0.88), Math.round(source.width * 0.1), Math.round(source.height * 0.12));
  }

  const imageData = context.getImageData(0, 0, source.width, source.height);
  const extraSeeds = number === 2 && variant.suffix === "-bridle"
    ? [{ x: Math.round(source.width * 0.76), y: Math.round(source.height * 0.3) }]
    : [];
  removeConnectedBackground(imageData, extraSeeds);
  if (number === 2 && variant.suffix === "-bridle") {
    removeCheckerboardInsideReins(imageData);
  }
  context.putImageData(imageData, 0, 0);
  const output = cropTransparentCanvas(canvas);
  await writeFile(join(outputDirectoryPath, `horse-${number}${variant.suffix}.png`), output.toBuffer("image/png"));
}

await mkdir(outputDirectoryPath, { recursive: true });
for (const number of horseNumbers) {
  for (const variant of variants) {
    await makeTransparentHorseAsset(number, variant);
  }
}
