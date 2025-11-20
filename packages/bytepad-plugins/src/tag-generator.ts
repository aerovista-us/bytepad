import type { Note, Plugin } from "bytepad-types";

export const TagGeneratorPlugin: Plugin = {
  name: "tag-generator",

  onNoteUpdate(note: Note, core: any) {
    if (!note.content) return;
    if (note.tags && note.tags.length > 0) return;

    const detectedTags: string[] = [];

    if (/todo|task/i.test(note.content)) detectedTags.push("todo");
    if (/idea|concept/i.test(note.content)) detectedTags.push("idea");
    if (/bug|issue/i.test(note.content)) detectedTags.push("issue");

    if (detectedTags.length > 0) {
      core.updateNote(note.id, {
        tags: Array.from(new Set([...(note.tags ?? []), ...detectedTags])),
      });
    }
  },
};
