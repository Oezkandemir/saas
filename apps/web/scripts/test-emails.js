// A simple script to test sending emails through the edge function
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or key in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test email addresses
const testEmail = process.argv[2] || "test@example.com";

const testEmails = async () => {
  console.log(`Testing emails with address: ${testEmail}`);

  // Test welcome email
  try {
    console.log("Sending welcome email...");
    const welcomeResult = await supabase.functions.invoke("send-email", {
      body: {
        type: "welcome",
        email: testEmail,
        name: "Test User",
      },
    });

    if (welcomeResult.error) {
      console.error("Error sending welcome email:", welcomeResult.error);
    } else {
      console.log("Welcome email sent successfully:", welcomeResult.data);
    }
  } catch (error) {
    console.error("Exception sending welcome email:", error);
  }

  // Test confirmation email
  try {
    console.log("Sending confirmation email...");
    const confirmationResult = await supabase.functions.invoke("send-email", {
      body: {
        type: "confirmation",
        email: testEmail,
        name: "Test User",
        actionUrl: "https://cenety.com/auth/confirm?token=test-token",
      },
    });

    if (confirmationResult.error) {
      console.error(
        "Error sending confirmation email:",
        confirmationResult.error
      );
    } else {
      console.log(
        "Confirmation email sent successfully:",
        confirmationResult.data
      );
    }
  } catch (error) {
    console.error("Exception sending confirmation email:", error);
  }

  console.log("Email tests completed");
};

testEmails().catch(console.error);
