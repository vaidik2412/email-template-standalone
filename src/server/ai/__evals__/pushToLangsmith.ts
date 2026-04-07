/**
 * Push eval results to LangSmith as a Dataset + Experiment.
 *
 * Usage:
 *   npx tsx src/server/ai/__evals__/pushToLangsmith.ts
 *
 * Requires LANGSMITH_API_KEY and APP_OPENAI_API_KEY in .env.local.
 */

import { readFileSync } from 'node:fs';
import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';

// --- Load .env.local ---
try {
  const envLocal = readFileSync('.env.local', 'utf8');
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {}

// --- Imports (after env is loaded) ---
import { EVAL_DATASET } from './dataset';
import { runStructuralEvals, type EvalScore } from './evaluators/structural';
import { runVariableEvals } from './evaluators/variableUsage';
import { runWhatsappEvals } from './evaluators/whatsappRules';

// We need to dynamically import generateTemplate after env is loaded
// so that getOpenAIApiKey() can find the key.

const DATASET_NAME = 'Template Generation Evals';
const EXPERIMENT_PREFIX = 'template-gen';

async function main() {
  const { generateTemplate } = await import('../generateTemplate');

  const client = new Client();

  // --- Ensure dataset exists with all examples ---
  let dataset;
  try {
    dataset = await client.readDataset({ datasetName: DATASET_NAME });
    console.log(`Dataset "${DATASET_NAME}" already exists (${dataset.id})`);
  } catch {
    dataset = await client.createDataset(DATASET_NAME, {
      description: 'Deterministic evals for the AI template generation agent',
    });
    console.log(`Created dataset "${DATASET_NAME}" (${dataset.id})`);
  }

  // Check existing examples
  const existingExamples: Array<{ id: string }> = [];
  for await (const ex of client.listExamples({ datasetId: dataset.id })) {
    existingExamples.push(ex);
  }

  if (existingExamples.length === 0) {
    console.log(`Seeding ${EVAL_DATASET.length} examples...`);
    await client.createExamples({
      datasetId: dataset.id,
      inputs: EVAL_DATASET.map((ex) => ({
        description: ex.input,
        tags: ex.tags,
        expectRejection: ex.expectRejection,
      })),
      outputs: EVAL_DATASET.map((ex) => ({
        expected: ex.expected,
        expectRejection: ex.expectRejection,
      })),
    });
    console.log('Examples seeded.');
  } else {
    console.log(`Dataset already has ${existingExamples.length} examples, skipping seed.`);
  }

  // --- Run evaluation ---
  console.log('\nRunning evaluation...\n');

  const modelName = process.env.APP_OPENAI_MODEL || 'gpt-4o-mini';

  await evaluate(
    async (input: {
      description: string;
      tags: string[];
      expectRejection: boolean;
    }) => {
      try {
        const result = await generateTemplate({ description: input.description });
        return { result, error: null };
      } catch (e) {
        return { result: null, error: e instanceof Error ? e.message : String(e) };
      }
    },
    {
      data: DATASET_NAME,
      evaluators: [
        // Wrap all deterministic evaluators as LangSmith evaluators
        ({ outputs, referenceOutputs }) => {
          const expectRejection = referenceOutputs?.expectRejection as boolean;
          const result = outputs?.result;
          const error = outputs?.error;

          // Rejection check
          if (expectRejection) {
            return {
              key: 'rejection_correctness',
              score: error ? 1 : 0,
              comment: error ? 'Correctly rejected' : 'Should have been rejected but was not',
            };
          }

          if (!result) {
            return {
              key: 'generation_success',
              score: 0,
              comment: `Unexpected error: ${error}`,
            };
          }

          const expected = (referenceOutputs?.expected || {}) as Record<string, unknown>;
          const allScores: EvalScore[] = [];

          allScores.push(...runStructuralEvals(result, expected));
          allScores.push(...runVariableEvals(result));

          if (result.channel === 'WHATSAPP') {
            allScores.push(...runWhatsappEvals(result));
          }

          const failed = allScores.filter((s) => s.score === 0);
          const passRate = (allScores.length - failed.length) / allScores.length;

          return {
            key: 'deterministic_pass_rate',
            score: passRate,
            comment: failed.length > 0
              ? `Failed: ${failed.map((f) => `${f.key} (${f.comment})`).join('; ')}`
              : `All ${allScores.length} checks passed`,
          };
        },
        // Individual score per evaluator category
        ({ outputs, referenceOutputs }) => {
          const result = outputs?.result;
          if (!result || referenceOutputs?.expectRejection) {
            return { key: 'structural', score: 1 };
          }
          const expected = (referenceOutputs?.expected || {}) as Record<string, unknown>;
          const scores = runStructuralEvals(result, expected);
          const failed = scores.filter((s) => s.score === 0);
          return {
            key: 'structural',
            score: failed.length === 0 ? 1 : 0,
            comment: failed.length > 0 ? failed.map((f) => f.key).join(', ') : undefined,
          };
        },
        ({ outputs, referenceOutputs }) => {
          const result = outputs?.result;
          if (!result || referenceOutputs?.expectRejection) {
            return { key: 'variable_usage', score: 1 };
          }
          const scores = runVariableEvals(result);
          const failed = scores.filter((s) => s.score === 0);
          return {
            key: 'variable_usage',
            score: failed.length === 0 ? 1 : 0,
            comment: failed.length > 0 ? failed.map((f) => f.key).join(', ') : undefined,
          };
        },
        ({ outputs, referenceOutputs }) => {
          const result = outputs?.result;
          if (!result || referenceOutputs?.expectRejection || result.channel !== 'WHATSAPP') {
            return { key: 'whatsapp_rules', score: 1 };
          }
          const scores = runWhatsappEvals(result);
          const failed = scores.filter((s) => s.score === 0);
          return {
            key: 'whatsapp_rules',
            score: failed.length === 0 ? 1 : 0,
            comment: failed.length > 0 ? failed.map((f) => f.key).join(', ') : undefined,
          };
        },
      ],
      experimentPrefix: `${EXPERIMENT_PREFIX}-${modelName}`,
      maxConcurrency: 3,
    },
  );

  console.log('\nDone! Check LangSmith → Datasets & Experiments for results.');
}

main().catch((err) => {
  console.error('Eval failed:', err);
  process.exit(1);
});
