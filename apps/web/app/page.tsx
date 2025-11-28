"use client";

import { useContext, useState, useEffect, useMemo } from "react";
import { CoreContext } from "./providers";
import type { Board, Note } from "bytepad-types";
import { NoteCard } from "../components/NoteCard";
import { SearchBar } from "../components/SearchBar";
import { BoardSelector } from "../components/BoardSelector";
import { UndoRedo } from "../components/UndoRedo";
import { PaginatedNoteList } from "../components/PaginatedNoteList";
import { VirtualizedNoteList } from "../components/VirtualizedNoteList";

export default function Home() {
  const core = useContext(CoreContext);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"paginated" | "virtual">("paginated");
  const [useVirtualScroll, setUseVirtualScroll] = useState(false);

  useEffect(() => {
    if (!core) return;
    
    // Store core in a const so TypeScript knows it's not null in closures
    const coreInstance = core;

    // Initial load
    const loadedBoards = coreInstance.getAllBoards();
    setBoards(loadedBoards);
    
    // Select first board or create default
    if (loadedBoards.length > 0) {
      setSelectedBoardId(loadedBoards[0].id);
      setNotes(loadedBoards[0].notes);
    } else {
      // Create default board
      coreInstance.createBoard({ name: "My Board" }).then((board) => {
        setBoards([board]);
        setSelectedBoardId(board.id);
        setNotes(board.notes);
      });
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!coreInstance) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        coreInstance.undo().catch(console.error);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        coreInstance.redo().catch(console.error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);

    // Listen for board changes
    const updateBoards = () => {
      if (!coreInstance) return;
      const updatedBoards = coreInstance.getAllBoards();
      setBoards(updatedBoards);
      
      if (selectedBoardId) {
        const board = coreInstance.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    // Listen for note changes
    const updateNotes = (payload: { boardId: string; note: Note }) => {
      if (!coreInstance) return;
      if (payload.boardId === selectedBoardId) {
        const board = coreInstance.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    const handleNoteDeleted = (payload: { boardId: string; noteId: string }) => {
      if (!coreInstance) return;
      if (payload.boardId === selectedBoardId) {
        const board = coreInstance.getBoard(selectedBoardId);
        if (board) {
          setNotes(board.notes);
        }
      }
    };

    coreInstance.events.on("boardCreated", updateBoards);
    coreInstance.events.on("boardUpdated", updateBoards);
    coreInstance.events.on("boardDeleted", updateBoards);
    coreInstance.events.on("noteCreated", updateNotes);
    coreInstance.events.on("noteUpdated", updateNotes);
    coreInstance.events.on("noteDeleted", handleNoteDeleted);

    return () => {
      coreInstance.events.off("boardCreated", updateBoards);
      coreInstance.events.off("boardUpdated", updateBoards);
      coreInstance.events.off("boardDeleted", updateBoards);
      coreInstance.events.off("noteCreated", updateNotes);
      coreInstance.events.off("noteUpdated", updateNotes);
      coreInstance.events.off("noteDeleted", handleNoteDeleted);
    };
  }, [core, selectedBoardId]);

  // Filter notes based on search query (must be before conditional return)
  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const content = note.contentHTML.toLowerCase();
      const tags = note.tags.join(" ").toLowerCase();
      return content.includes(query) || tags.includes(query);
    });
  }, [notes, searchQuery]);

  if (!core) return <div>Loading BytePad…</div>;

  // TypeScript now knows core is not null after the early return
  const coreInstance = core;

  const selectedBoard = selectedBoardId ? coreInstance.getBoard(selectedBoardId) : null;

  const handleCreateNote = async () => {
    if (!selectedBoardId) return;
    
    await coreInstance.createNote(selectedBoardId, {
      contentHTML: "<p>New Note</p>",
      geometry: { x: 0, y: 0, w: 200, h: 150, z: 0 },
    });
  };

  const handleUpdateNote = async (noteId: string, data: Partial<Note>) => {
    if (!selectedBoardId) return;
    await coreInstance.updateNote(selectedBoardId, noteId, data);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedBoardId) return;
    await coreInstance.deleteNote(selectedBoardId, noteId);
  };

  const handleCreateBoard = async () => {
    const board = await coreInstance.createBoard({ name: `Board ${boards.length + 1}` });
    setSelectedBoardId(board.id);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (boards.length <= 1) {
      alert("Cannot delete the last board. Create another board first.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this board? All notes will be lost.")) {
      await coreInstance.deleteBoard(boardId);
      // Select first remaining board
      const remaining = boards.filter((b) => b.id !== boardId);
      if (remaining.length > 0) {
        setSelectedBoardId(remaining[0].id);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-2">BytePad 3.0</h1>
        <a
          href="/settings"
          className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Settings
        </a>
      </div>

      <BoardSelector
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelect={setSelectedBoardId}
        onCreate={handleCreateBoard}
        onDelete={handleDeleteBoard}
      />

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleCreateNote}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={!selectedBoardId}
        >
          + Note
        </button>
        <UndoRedo />
        {selectedBoard && (
          <span className="text-sm text-gray-600">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <SearchBar onSearch={setSearchQuery} />

      {filteredNotes.length === 0 && notes.length > 0 && (
        <div className="text-center text-gray-500 py-8">
          No notes match your search.
        </div>
      )}

      {filteredNotes.length === 0 && notes.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No notes yet. Create one to get started.
        </div>
      )}

      {filteredNotes.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={viewMode === "virtual"}
                  onChange={(e) => setViewMode(e.target.checked ? "virtual" : "paginated")}
                  className="mr-1"
                />
                Virtual Scroll (for 100+ notes)
              </label>
            </div>
          </div>

          {viewMode === "virtual" && filteredNotes.length > 50 ? (
            <VirtualizedNoteList
              notes={filteredNotes}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              itemHeight={200}
              containerHeight={600}
            />
          ) : (
            <PaginatedNoteList
              notes={filteredNotes}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              itemsPerPage={20}
            />
          )}
        </>
      )}
    </div>
  );
}
