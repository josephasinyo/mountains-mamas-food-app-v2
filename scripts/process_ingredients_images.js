const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '..', 'public', 'images', 'cookies_breads');
const outputDir = path.join(__dirname, '..', 'public', 'images', 'ingredients');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const imageConfigs = [
    // Breads
    {
        src: 'French bread.jpeg',
        dest: 'french_bread.jpg',
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'Gluten free Rustic rosemary .jpeg',
        dest: 'gluten_free_rustic_rosemary.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'Gluten free tortillas.jpeg',
        dest: 'gluten_free_tortillas.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'Regular tortilla.png',
        dest: 'regular_tortilla.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'Seedy whole grain fococcia.jpeg',
        dest: 'seedy_whole_grain_focaccia.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'White sandwich bread.jpeg',
        dest: 'white_sandwich_bread.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'croissant.jpeg',
        dest: 'croissant.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'herby focaccia.jpeg',
        dest: 'herby_focaccia.jpg',
        fit: 'cover',
        position: 'center',
    },

    // Cookies & Treats
    {
        src: 'chocolate chip.jpeg',
        dest: 'chocolate_chip_cookie.jpg',
        // Crop the cookie focused on the delicious lower 65% area
        customCrop: async (img) => {
            const meta = await img.metadata();
            const width = meta.width;
            const height = meta.height;
            const cropTop = Math.floor(height * 0.35);
            const cropHeight = height - cropTop;
            return img.extract({ left: 0, top: cropTop, width: width, height: cropHeight });
        },
    },
    {
        src: 'Oatmeal raisin.jpeg',
        dest: 'oatmeal_raisin_cookie.jpg',
        customCrop: async (img) => {
            const meta = await img.metadata();
            const width = meta.width;
            const height = meta.height;
            const cropTop = Math.floor(height * 0.38);
            const cropHeight = height - cropTop;
            return img.extract({ left: 0, top: cropTop, width: width, height: cropHeight });
        },
    },
    {
        src: 'Salted caramel.jpeg',
        dest: 'salted_caramel_cookie.jpg',
        customCrop: async (img) => {
            const meta = await img.metadata();
            const width = meta.width;
            const height = meta.height;
            const cropTop = Math.floor(height * 0.38);
            const cropHeight = height - cropTop;
            return img.extract({ left: 0, top: cropTop, width: width, height: cropHeight });
        },
    },
    {
        src: 'lemon blueberrry.jpeg',
        dest: 'lemon_blueberry_cookie.jpg',
        customCrop: async (img) => {
            const meta = await img.metadata();
            const width = meta.width;
            const height = meta.height;
            const cropTop = Math.floor(height * 0.38);
            const cropHeight = height - cropTop;
            return img.extract({ left: 0, top: cropTop, width: width, height: cropHeight });
        },
    },
    {
        src: 'Gluten-free brownie.jpeg',
        dest: 'gluten_free_brownie.jpg',
        fit: 'cover',
        position: 'center',
    },
    {
        src: 'Gluten-free granola bar.jpeg',
        dest: 'gluten_free_granola_bar.jpg',
        fit: 'cover',
        position: 'center',
    },
];

async function processAll() {
    console.log('Processing cookies & breads images...');
    for (const config of imageConfigs) {
        const inputPath = path.join(inputDir, config.src);
        const outputPath = path.join(outputDir, config.dest);

        if (!fs.existsSync(inputPath)) {
            console.warn(`File not found: ${inputPath}`);
            continue;
        }

        try {
            let pipeline = sharp(inputPath);

            if (config.customCrop) {
                pipeline = await config.customCrop(pipeline);
            }

            await pipeline
                .resize(800, 600, {
                    fit: config.fit || 'cover',
                    position: config.position || 'center',
                })
                .jpeg({ quality: 90, mozjpeg: true })
                .toFile(outputPath);

            console.log(`✓ Generated: ${config.dest}`);
        } catch (err) {
            console.error(`Error processing ${config.src}:`, err);
        }
    }
    console.log('Image processing complete!');
}

processAll();
