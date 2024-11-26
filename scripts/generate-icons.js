import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateIcons() {
  const sizes = [192, 512];
  const sourceIcon = join(__dirname, "../public/img/fav.png");

  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFile(join(__dirname, `../public/img/icon-${size}x${size}.png`));

    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error);
