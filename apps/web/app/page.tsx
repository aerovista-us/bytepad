"use client";

import { useContext } from "react";
import { CoreContext } from "./providers";

export default function Home() {
  const core = useContext(CoreContext);

  if (!core) return <div>Loading BytePad…</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => core.createNote({ title: "New Note" })}
        className="px-3 py-2 bg-blue-600 text-white rounded"
      >
        + Note
      </button>

      <div className="grid grid-cols-3 gap-3 mt-6">
        {core.getAllNotes().map(note => (
          <div key={note.id} className="p-3 border rounded bg-white shadow">
            <h3 className="font-semibold">{note.title}</h3>
            <p>{note.content}</p>
            <small>{note.tags.join(", ")}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
