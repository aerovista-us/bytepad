"use client";

import type { Board } from "bytepad-types";

interface BoardSelectorProps {
  boards: Board[];
  selectedBoardId: string | null;
  onSelect: (boardId: string) => void;
  onCreate: () => void;
  onDelete: (boardId: string) => void;
}

export function BoardSelector({
  boards,
  selectedBoardId,
  onSelect,
  onCreate,
  onDelete,
}: BoardSelectorProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <select
        value={selectedBoardId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
      <button
        onClick={onCreate}
        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        title="Create new board"
      >
        + Board
      </button>
      {selectedBoardId && boards.length > 1 && (
        <button
          onClick={() => onDelete(selectedBoardId)}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          title="Delete board"
        >
          Delete Board
        </button>
      )}
    </div>
  );
}

