"use client";

import { useContext, useState, useEffect } from "react";
import { CoreContext } from "../app/providers";

export function UndoRedo() {
  const core = useContext(CoreContext);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!core) return;

    const updateHistory = () => {
      setCanUndo(core.canUndo());
      setCanRedo(core.canRedo());
    };

    updateHistory();

    core.events.on("historyChanged", updateHistory);
    core.events.on("boardCreated", updateHistory);
    core.events.on("boardUpdated", updateHistory);
    core.events.on("boardDeleted", updateHistory);
    core.events.on("noteCreated", updateHistory);
    core.events.on("noteUpdated", updateHistory);
    core.events.on("noteDeleted", updateHistory);

    return () => {
      core.events.off("historyChanged", updateHistory);
      core.events.off("boardCreated", updateHistory);
      core.events.off("boardUpdated", updateHistory);
      core.events.off("boardDeleted", updateHistory);
      core.events.off("noteCreated", updateHistory);
      core.events.off("noteUpdated", updateHistory);
      core.events.off("noteDeleted", updateHistory);
    };
  }, [core]);

  if (!core) return null;

  const handleUndo = async () => {
    await core.undo();
  };

  const handleRedo = async () => {
    await core.redo();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </div>
  );
}

