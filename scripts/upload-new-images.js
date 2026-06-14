const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

const srcDir = 'C:\\Users\\josep\\.gemini\\antigravity-ide\\brain\\72c967f9-7a01-440a-8439-bd9e1b7b9409';
const destDir = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Files in srcDir
const files = fs.readdirSync(srcDir);
const newFiles = files.filter(f => f.startsWith('media__1781276704') && f.endsWith('.jpg'));

async function main() {
    console.log(`Found ${newFiles.length} new files.`);

    for (const file of newFiles) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        
        // Copy to public/images/
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to public/images/`);

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(srcPath);
        console.log(`Uploading ${file} to Supabase...`);

        const { data, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(file, fileBuffer, {
                contentType: 'image/jpeg',
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

main().catch(err => {
    console.error(err);
});
