// Node script to test or setup portfolio_checkouts table in Supabase
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://lkzsjkwxzhkdgcuokzwt.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_uAhwwf-K_jnBBMCkITT9lg_qYs3_gqu";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testTable() {
  console.log("Testing connection to Supabase:", SUPABASE_URL);
  
  const testPayload = {
    session_id: "test_session_" + Date.now(),
    action_type: "SETUP_VERIFICATION",
    page_path: "/test",
    referrer: "Direct",
    user_agent: "Node.js Setup Script",
    browser: "Setup CLI",
    os: "Windows",
    device_type: "Desktop",
    screen_resolution: "1920x1080",
    language: "en-US",
    ip_address: "127.0.0.1",
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from("portfolio_checkouts").insert(testPayload).select();

  if (error) {
    console.log("\n❌ Table 'portfolio_checkouts' is not yet created in Supabase.");
    console.log("Error details:", error.message);
    console.log("\n👉 To create the table, copy and paste the SQL from 'scripts/schema.sql' into your Supabase Dashboard SQL Editor:");
    console.log("   URL: https://supabase.com/dashboard/project/lkzsjkwxzhkdgcuokzwt/sql/new\n");
  } else {
    console.log("\n✅ Success! Table 'portfolio_checkouts' exists and is accepting records.");
    console.log("Inserted record:", data);
  }
}

testTable();
