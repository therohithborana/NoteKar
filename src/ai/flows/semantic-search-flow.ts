
'use server';
/**
 * @fileoverview A semantic search flow for notes.
 *
 * - searchNotes - A function that performs semantic search on notes.
 * - SearchNotesInput - The input type for the searchNotes function.
 * - SearchNotesOutput - The return type for the searchNotes function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

const NoteSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().optional(),
  drawing: z.string().optional(),
  type: z.enum(['text', 'drawing']),
});

const SearchNotesInputSchema = z.object({
  query: z.string(),
  notes: z.array(NoteSchema),
});

type SearchNotesInput = z.infer<typeof SearchNotesInputSchema>;

const SearchNotesOutputSchema = z.object({
  noteIds: z.array(z.number()),
});

type SearchNotesOutput = z.infer<typeof SearchNotesOutputSchema>;

const searchPrompt = ai.definePrompt({
  name: 'searchNotesPrompt',
  input: {schema: SearchNotesInputSchema},
  output: {schema: SearchNotesOutputSchema},
  model: googleAI('gemini-2.0-flash-preview'),
  config: {
    model: googleAI('gemini-2.0-flash-preview'),
  },
  prompt: `You are a semantic search engine for a notes application.
You will be given a search query and a list of notes.
Your task is to return the IDs of the notes that are most relevant to the search query.
Consider the title, content, and drawing description (if available) of each note.

Search Query:
"{{query}}"

Notes:
{{#each notes}}
---
Note ID: {{id}}
Title: {{title}}
{{#if content}}
Content:
{{content}}
{{/if}}
{{#if drawing}}
Drawing (contains): {{drawing}}
{{/if}}
---
{{/each}}

Return the IDs of the most relevant notes. If no notes are relevant, return an empty array.
`,
});

const searchNotesFlow = ai.defineFlow(
  {
    name: 'searchNotesFlow',
    inputSchema: SearchNotesInputSchema,
    outputSchema: SearchNotesOutputSchema,
  },
  async (input) => {
    if (!input.query) {
        return { noteIds: input.notes.map(n => n.id) };
    }
    const {output} = await searchPrompt(input);
    return output!;
  }
);

export async function searchNotes(
  input: SearchNotesInput
): Promise<SearchNotesOutput> {
  return await searchNotesFlow(input);
}
