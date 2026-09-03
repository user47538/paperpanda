import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const sourcePath = new URL("../public/property/jumps-sheet.jpeg", import.meta.url);
const outputDirectory = fileURLToPath(new URL("../public/property/jumps/", import.meta.url));

const crops = [
  { name: "vertical-jump", x: 80, y: 380, width: 540, height: 540 },
  { name: "spread-oxer", x: 650, y: 380, width: 630, height: 560 },
  { name: "water-jump", x: 1280, y: 390, width: 620, height: 540 },
  { name: "rustic-plank", x: 1900, y: 420, width: 560, height: 520 },
  { name: "hay-bale", x: 2460, y: 380, width: 590, height: 540 }
];

function removeConnectedWhiteBackground(imageData) {
  const { data, width, height } = imageData;
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

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const offset = index * 4;
    const distanceFromWhite = Math.max(255 - data[offset], 255 - data[offset + 1], 255 - data[offset + 2]);
    if (distanceFromWhite > 30) continue;
    data[offset + 3] = distanceFromWhite <= 16 ? 0 : Math.round(((distanceFromWhite - 16) / 14) * 255);
    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
}

await mkdir(outputDirectory, { recursive: true });
const source = await loadImage(fileURLToPath(sourcePath));
const workingCanvas = createCanvas(source.width, source.height);
const workingContext = workingCanvas.getContext("2d");
workingContext.drawImage(source, 0, 0);
const sourceData = workingContext.getImageData(0, 0, source.width, source.height);
removeConnectedWhiteBackground(sourceData);
workingContext.putImageData(sourceData, 0, 0);

for (const crop of crops) {
  const canvas = createCanvas(crop.width, crop.height);
  canvas.getContext("2d").drawImage(
    workingCanvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );
  await writeFile(join(outputDirectory, `${crop.name}.png`), canvas.toBuffer("image/png"));
}
