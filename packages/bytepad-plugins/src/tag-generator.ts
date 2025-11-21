import type { Note, Plugin, CoreInstance } from "bytepad-types";

export const TagGeneratorPlugin: Plugin = {
  name: "tag-generator",

  onNoteUpdate(boardId: string, note: Note, core: CoreInstance) {
    if (!note.contentHTML) return;
    // Skip if user manually tagged with #
    if (note.contentHTML.includes("#")) return;

    const detectedTags: string[] = [];
    const existingTags = note.tags || [];

    if (/todo|task/i.test(note.contentHTML) && !existingTags.includes("todo")) {
      detectedTags.push("todo");
    }
    if (/idea|concept/i.test(note.contentHTML) && !existingTags.includes("idea")) {
      detectedTags.push("idea");
    }
    if (/bug|issue/i.test(note.contentHTML) && !existingTags.includes("issue")) {
      detectedTags.push("issue");
    }

    if (detectedTags.length > 0) {
      core.updateNote(boardId, note.id, {
        tags: Array.from(new Set([...existingTags, ...detectedTags])),
      });
    }
  },
};
