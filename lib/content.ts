import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { isValidWord } from './tr';

const entrySchema = z.object({
  word: z.string().refine(isValidWord, 'kelime 3-10 büyük Türkçe harf olmalı'),
  clues: z.array(z.string().min(3)).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()).optional(),
});

export type BankEntry = z.infer<typeof entrySchema>;

export function validateBank(raw: unknown): BankEntry[] {
  const bank = z.array(entrySchema).parse(raw);
  const seen = new Set<string>();
  for (const e of bank) {
    if (seen.has(e.word)) throw new Error(`kelime bankasında tekrar: ${e.word}`);
    seen.add(e.word);
  }
  return bank;
}

export function loadBank(): BankEntry[] {
  const file = path.join(process.cwd(), 'content', 'word-bank.json');
  return validateBank(JSON.parse(readFileSync(file, 'utf8')));
}
