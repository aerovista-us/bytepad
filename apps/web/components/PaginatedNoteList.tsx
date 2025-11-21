"use client";

import { usePagination } from "../hooks/usePagination";
import { NoteCard } from "./NoteCard";
import type { Note } from "bytepad-types";

interface PaginatedNoteListProps {
  notes: Note[];
  onUpdate: (noteId: string, data: Partial<Note>) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  itemsPerPage?: number;
}

export function PaginatedNoteList({
  notes,
  onUpdate,
  onDelete,
  itemsPerPage = 20,
}: PaginatedNoteListProps) {
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
  } = usePagination({
    items: notes,
    itemsPerPage,
  });

  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No notes yet. Create one to get started.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {paginatedItems.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({notes.length} total notes)
          </div>
          <div className="flex gap-2">
            <button
              onClick={previousPage}
              disabled={!canGoPrevious}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 rounded ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={nextPage}
              disabled={!canGoNext}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

