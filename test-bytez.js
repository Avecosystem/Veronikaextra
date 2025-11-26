import Bytez from "bytez.js";

// Test the Bytez API integration
async function testBytez() {
  try {
    // Use the API key from environment variables
    const apiKey = process.env.VITE_BYTEZ_API_KEY || process.env.API_KEY || "15d3999b633fbcfca8abca0e3c875a3c";
    console.log("Using API key:", apiKey.substring(0, 8) + "...");
    
    const sdk = new Bytez(apiKey);
    const model = sdk.model("UnfilteredAI/NSFW-GEN-ANIME");
    
    console.log("Initialized Bytez SDK with NSFW-GEN-ANIME model");
    
    // Test the model with a simple prompt
    console.log("Running test prompt: 'A cat in a wizard hat'");
    const { error, output } = await model.run("A cat in a wizard hat");
    
    if (error) {
      console.error("Error:", error);
      return;
    }
    
    console.log("Success! Output:", output);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testBytez();