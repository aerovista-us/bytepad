"use client";

import { useContext, useState, useEffect } from "react";
import { CoreContext } from "../providers";
import type { Board, Note } from "bytepad-types";
import { sanitizeHTML } from "../../lib/sanitize";

export default function PanelPage() {
  const core = useContext(CoreContext);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!core) return;

    const loadedBoards = core.getAllBoards();
    setBoards(loadedBoards);
    
    if (loadedBoards.length > 0) {
      setSelectedBoardId(loadedBoards[0].id);
      setNotes(loadedBoards[0].notes);
    }

    const updateBoards = () => {
      const updatedBoards = core.getAllBoards();
      setBoards(updatedBoards);
      
      if (selectedBoardId) {
        const board = core.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    const updateNotes = (payload: { boardId: string; note: Note }) => {
      if (payload.boardId === selectedBoardId) {
        const board = core.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    const handleNoteDeleted = (payload: { boardId: string; noteId: string }) => {
      if (payload.boardId === selectedBoardId) {
        const board = core.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    core.events.on("boardCreated", updateBoards);
    core.events.on("boardUpdated", updateBoards);
    core.events.on("noteCreated", updateNotes);
    core.events.on("noteUpdated", updateNotes);
    core.events.on("noteDeleted", handleNoteDeleted);

    return () => {
      core.events.off("boardCreated", updateBoards);
      core.events.off("boardUpdated", updateBoards);
      core.events.off("noteCreated", updateNotes);
      core.events.off("noteUpdated", updateNotes);
      core.events.off("noteDeleted", handleNoteDeleted);
    };
  }, [core, selectedBoardId]);

  if (!core) {
    return (
      <div className="p-4 bg-gray-900 text-gray-100 min-h-screen">
        <div className="text-sm">Loading BytePad Panel...</div>
      </div>
    );
  }

  const selectedBoard = selectedBoardId ? core.getBoard(selectedBoardId) : null;

  const handleCreateNote = async () => {
    if (!selectedBoardId) return;
    
    await core.createNote(selectedBoardId, {
      contentHTML: "<p>New Note</p>",
      geometry: { x: 0, y: 0, w: 150, h: 100, z: 0 },
    });
  };

  return (
    <div className="p-2 bg-gray-900 text-gray-100 min-h-screen">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-sm font-bold">BytePad Panel</h1>
        {selectedBoard && (
          <span className="text-xs text-gray-400">{selectedBoard.name}</span>
        )}
      </div>

      <div className="mb-2">
        <button
          onClick={handleCreateNote}
          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
          disabled={!selectedBoardId}
        >
          + Note
        </button>
      </div>

      <div className="space-y-1 max-h-[calc(100vh-80px)] overflow-y-auto">
        {notes.map(note => (
          <div
            key={note.id}
            className="p-2 bg-gray-800 border border-gray-700 rounded text-xs"
          >
            <div
              className="text-gray-300 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(note.contentHTML || "<p>No content</p>"),
              }}
            />
            {note.tags && note.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {note.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-1 py-0.5 bg-indigo-900 text-indigo-200 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            No notes yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

