const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPushNotification() {
  try {
    console.log('Testing push notification...');
    
    // Insert a test notification into the database
    // This should trigger the database trigger and send a push notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: process.argv[2] || 'test-user-id', // Pass user ID as argument
        type: 'test',
        title: 'Test Push Notification',
        message: 'This is a test push notification!',
        data: { test: true }
      });

    if (error) {
      console.error('Error inserting notification:', error);
    } else {
      console.log('Test notification inserted:', data);
      console.log('You should receive a push notification on your device shortly!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testPushNotification(); 