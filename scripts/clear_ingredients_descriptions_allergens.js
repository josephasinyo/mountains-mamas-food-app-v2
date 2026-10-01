const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}
const supabase = createClient(url, key);

async function clearDescriptionsAndAllergens() {
  console.log('Clearing description and allergens for all breads and cookies in ingredients table...');
  
  // Update all ingredients to have empty description and empty allergens array
  const { data, error } = await supabase
    .from('ingredients')
    .update({
      description: '',
      allergens: []
    })
    .not('id', 'is', null)
    .select('id, name, type');

  if (error) {
    console.error('Error updating ingredients:', error);
    return;
  }

  console.log(`✓ Successfully cleared description and allergens for ${data?.length || 0} ingredients:`);
  for (const item of data || []) {
    console.log(`  - [${item.type}] ${item.name}`);
  }
}

clearDescriptionsAndAllergens();
