const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
dotenv.config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const bucketName = 'campaign-images';

async function main() {
    // 1. Ensure bucket exists and is public
    console.log(`Checking bucket: ${bucketName}...`);
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    if (getBucketsError) {
        console.error('Error listing buckets:', getBucketsError);
        process.exit(1);
    }

    const bucketExists = buckets.some(b => b.name === bucketName);
    if (!bucketExists) {
        console.log(`Creating public bucket: ${bucketName}...`);
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
        });
        if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            process.exit(1);
        }
        console.log('Bucket created successfully.');
    } else {
        console.log('Bucket already exists.');
    }

    // 2. Upload images
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    const files = fs.readdirSync(imagesDir);

    for (const file of files) {
        if (file.startsWith('media__') && file.endsWith('.png')) {
            const filePath = path.join(imagesDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            console.log(`Uploading ${file}...`);

            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(file, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error(`Failed to upload ${file}:`, uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(file);
                console.log(`Uploaded ${file} successfully.`);
                console.log(`Public URL: ${publicUrl}`);
            }
        }
    }
}

main().catch(err => {
    console.error('Unhandled error:', err);
});
