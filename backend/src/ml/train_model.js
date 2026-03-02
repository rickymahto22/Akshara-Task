import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const dataPath = path.join(rootDir, "data", "training_data.json");
const modelPath = path.join(__dirname, "model.json");

// Simple text preprocessing
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const buildVocabulary = (documents) => {
  const vocabSet = new Set();
  documents.forEach((tokens) => tokens.forEach((t) => vocabSet.add(t)));
  return Array.from(vocabSet);
};

const computeTf = (tokens, vocabIndex) => {
  const tf = new Array(vocabIndex.size).fill(0);
  tokens.forEach((t) => {
    const idx = vocabIndex.get(t);
    if (idx !== undefined) tf[idx] += 1;
  });
  const len = tokens.length || 1;
  for (let i = 0; i < tf.length; i++) {
    tf[i] = tf[i] / len;
  }
  return tf;
};

const computeIdf = (docsTokenized, vocabIndex) => {
  const N = docsTokenized.length;
  const df = new Array(vocabIndex.size).fill(0);

  docsTokenized.forEach((tokens) => {
    const seen = new Set();
    tokens.forEach((t) => {
      const idx = vocabIndex.get(t);
      if (idx !== undefined && !seen.has(idx)) {
        seen.add(idx);
        df[idx] += 1;
      }
    });
  });

  return df.map((d) => Math.log((N + 1) / (d + 1)) + 1); // smoothed IDF
};

const multiplyElementwise = (a, b) => a.map((v, i) => v * b[i]);

const addVectors = (a, b) => a.map((v, i) => v + b[i]);

const train = () => {
  if (!fs.existsSync(dataPath)) {
    console.error("Training data not found at", dataPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const rows = JSON.parse(raw);

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("Training data is empty or invalid");
    process.exit(1);
  }

  const texts = rows.map((r) => String(r.text || ""));
  const intents = rows.map((r) => String(r.intent || "default"));

  const tokenized = texts.map((t) => tokenize(t));
  const vocab = buildVocabulary(tokenized);
  const vocabIndex = new Map(vocab.map((t, i) => [t, i]));

  const idf = computeIdf(tokenized, vocabIndex);

  // Compute TF-IDF for each document
  const tfidfDocs = tokenized.map((tokens) => {
    const tf = computeTf(tokens, vocabIndex);
    return multiplyElementwise(tf, idf);
  });

  // Aggregate by intent: centroid of vectors
  const intentVectors = {};
  const intentCounts = {};

  intents.forEach((intent, i) => {
    if (!intentVectors[intent]) {
      intentVectors[intent] = new Array(vocab.length).fill(0);
      intentCounts[intent] = 0;
    }
    intentVectors[intent] = addVectors(intentVectors[intent], tfidfDocs[i]);
    intentCounts[intent] += 1;
  });

  const intentsList = Object.keys(intentVectors).map((name) => {
    const count = intentCounts[name] || 1;
    return {
      name,
      vector: intentVectors[name].map((v) => v / count),
    };
  });

  const model = {
    vocab,
    idf,
    intents: intentsList,
  };

  fs.writeFileSync(modelPath, JSON.stringify(model, null, 2), "utf-8");
  console.log(`Model trained on ${rows.length} examples and saved to ${modelPath}`);
};

train();

