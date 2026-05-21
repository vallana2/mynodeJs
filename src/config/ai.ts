import { ChatGroq } from "@langchain/groq";

// Main model — creative output (temperature 0.7)
export const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env["GROQ_API_KEY"],
});

// Deterministic model — for filter extraction (temperature 0)
// Same query should always produce same filters
export const deterministicModel = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env["GROQ_API_KEY"],
});


