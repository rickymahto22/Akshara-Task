import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelPath = path.join(__dirname, "model.json");
const responsesPath = path.join(__dirname, "intent_responses.json");

let model = null;
let intentResponses = {};

try {
  const rawModel = fs.readFileSync(modelPath, "utf-8");
  model = JSON.parse(rawModel);
} catch (err) {
  console.error(
    "Chatbot model not found. Please run `npm run train` to generate src/ml/model.json",
    err
  );
}

try {
  const rawResponses = fs.readFileSync(responsesPath, "utf-8");
  intentResponses = JSON.parse(rawResponses);
} catch (err) {
  console.error("Failed to load intent_responses.json", err);
}

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const buildVector = (tokens, vocabIndex, idf) => {
  const tf = new Array(vocabIndex.size).fill(0);
  tokens.forEach((t) => {
    const idx = vocabIndex.get(t);
    if (idx !== undefined) tf[idx] += 1;
  });
  const len = tokens.length || 1;
  for (let i = 0; i < tf.length; i++) {
    tf[i] = (tf[i] / len) * idf[i];
  }
  return tf;
};

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const getBotResponse = (text) => {
  const tokens = tokenize(text || "");
  if (!tokens.length) {
    return {
      intent: "default",
      response: "Please type a message so I can help you.",
      score: 0,
    };
  }

  if (!model || !model.vocab || !model.idf || !model.intents) {
    const fallback =
      intentResponses.default?.[0] ||
      "The chatbot model is not trained yet. Please contact the administrator.";
    return {
      intent: "default",
      response: fallback,
      score: 0,
    };
  }

  const vocabIndex = new Map(model.vocab.map((t, i) => [t, i]));
  const inputVec = buildVector(tokens, vocabIndex, model.idf);

  let bestIntent = "default";
  let bestScore = 0;

  model.intents.forEach((intent) => {
    const score = cosineSimilarity(inputVec, intent.vector);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent.name;
    }
  });

  // Optional threshold to avoid random matches
  const threshold = 0.05;
  if (bestScore < threshold) {
    bestIntent = "default";
  }

  const responses =
    intentResponses[bestIntent] || intentResponses.default || [
      "I'm not sure I understood that.",
    ];
  const response =
    responses[Math.floor(Math.random() * responses.length)];

  return {
    intent: bestIntent,
    response,
    score: bestScore,
  };
};

