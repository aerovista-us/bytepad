"use client";

import { useState, useRef, useEffect, useMemo, memo } from "react";
import type { Note } from "bytepad-types";
import { sanitizeHTML } from "../lib/sanitize";

interface NoteCardProps {
  note: Note;
  onUpdate: (noteId: string, data: Partial<Note>) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export const NoteCard = memo(function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.contentHTML);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editContent !== note.contentHTML) {
      await onUpdate(note.id, { contentHTML: editContent });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.contentHTML);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="p-3 border rounded bg-white shadow relative group">
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          title="Edit note"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          title="Delete note"
        >
          ×
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEditContent(e.currentTarget.innerHTML)}
            onKeyDown={handleKeyDown}
            className="text-sm min-h-[100px] p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            dangerouslySetInnerHTML={{ __html: editContent }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save (Ctrl+Enter)
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm cursor-pointer"
          onClick={() => setIsEditing(true)}
          dangerouslySetInnerHTML={{
            __html: sanitizeHTML(note.contentHTML || "<p>No content</p>"),
          }}
        />
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

