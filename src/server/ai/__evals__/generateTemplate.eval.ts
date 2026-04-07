import { describe, it, expect } from 'vitest';

import { generateTemplate } from '../generateTemplate';
import { EVAL_DATASET } from './dataset';
import { runStructuralEvals } from './evaluators/structural';
import { runVariableEvals } from './evaluators/variableUsage';
import { runWhatsappEvals } from './evaluators/whatsappRules';
import type { EvalScore } from './evaluators/structural';

function formatScoreReport(scores: EvalScore[]): string {
  const failed = scores.filter((s) => s.score === 0);
  if (failed.length === 0) {
    return `All ${scores.length} checks passed`;
  }

  return failed
    .map((s) => `  FAIL ${s.key}: ${s.comment || 'no details'}`)
    .join('\n');
}

describe('generateTemplate evals', () => {
  for (const example of EVAL_DATASET) {
    it(`[${example.tags.join(', ')}] ${example.input}`, async () => {
      let result: Awaited<ReturnType<typeof generateTemplate>> | undefined;
      let error: Error | undefined;

      try {
        result = await generateTemplate({ description: example.input });
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
      }

      // --- Rejection cases ---
      if (example.expectRejection) {
        expect(error, `Expected rejection for: "${example.input}"`).toBeDefined();
        return;
      }

      // --- Non-rejection cases ---
      expect(error, `Unexpected error: ${error?.message}`).toBeUndefined();
      expect(result, 'Expected a result').toBeDefined();

      if (!result) return;

      const allScores: EvalScore[] = [];

      // Structural evaluators
      allScores.push(...runStructuralEvals(result, example.expected));

      // Variable usage evaluators
      allScores.push(...runVariableEvals(result));

      // WhatsApp-specific evaluators
      if (result.channel === 'WHATSAPP') {
        allScores.push(...runWhatsappEvals(result));
      }

      // Report
      const failed = allScores.filter((s) => s.score === 0);
      const report = formatScoreReport(allScores);

      // Log full output for debugging
      console.log(`\n--- Result for: "${example.input}" ---`);
      console.log(`  Channel: ${result.channel} | Type: ${result.templateType} | Subtype: ${result.documentSubtype || '-'}`);
      console.log(`  Name: ${result.name}`);
      console.log(`  Scores: ${allScores.length - failed.length}/${allScores.length} passed`);
      if (failed.length > 0) {
        console.log(report);
      }

      // Assert all deterministic checks pass
      expect(failed, `\n${report}`).toHaveLength(0);
    });
  }
});
