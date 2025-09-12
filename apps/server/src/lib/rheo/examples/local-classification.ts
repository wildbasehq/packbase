import { z } from "zod";
import { LocalInference, type TextExample } from "../brain";
import {SafetyTrainingData} from '../dataset/safety-classification.ts'

const inference = new LocalInference();
inference.trainTextClassifier(SafetyTrainingData);

// You can use a simple enum schema
const CategoryEnum = z.enum(["friendly", "hostile", "satire"]);

// Or an object schema with a single enum "label" (also supported locally)
const CategoryObject = z.object({
  label: CategoryEnum,
});

async function run() {
  const prompt = "Experts confirm coffee is now 98% personality!";

  // Using enum schema: returns a string
  const enumResult = await inference.action(CategoryEnum, { prompt });
  console.log("Enum result JSON:", JSON.stringify(enumResult));

  // Using object schema: returns { label: string }
  const objectResult = await inference.action(CategoryObject, { prompt });
  console.log("Object result JSON:", JSON.stringify(objectResult));

  // Predict
    const prediction = inference.classifier?.predict(prompt)
    console.log('prediction, ', prediction)
}

run().catch((err) => {
  console.error("Local example failed:", err);
});
