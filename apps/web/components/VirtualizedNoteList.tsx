"use client";

import { useVirtualScroll } from "../hooks/useVirtualScroll";
import { NoteCard } from "./NoteCard";
import type { Note } from "bytepad-types";

interface VirtualizedNoteListProps {
  notes: Note[];
  onUpdate: (noteId: string, data: Partial<Note>) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  itemHeight?: number;
  containerHeight?: number;
}

export function VirtualizedNoteList({
  notes,
  onUpdate,
  onDelete,
  itemHeight = 200,
  containerHeight = 600,
}: VirtualizedNoteListProps) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    containerRef,
    startIndex,
  } = useVirtualScroll(notes, {
    itemHeight,
    containerHeight,
    overscan: 2,
  });

  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No notes yet. Create one to get started.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto border rounded"
      style={{ height: `${containerHeight}px` }}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
            {visibleItems.map((note, index) => (
              <div
                key={note.id}
                style={{ height: `${itemHeight}px` }}
                className="overflow-hidden"
              >
                <NoteCard
                  note={note}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

