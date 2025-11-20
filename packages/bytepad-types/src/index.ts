export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SyncEvent {
  type: "update" | "delete";
  payload: any;
}

export interface CoreConfig {
  storage: {
    load: () => Promise<Note[]>;
    save: (note: Note) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
}

export interface Plugin {
  name: string;

  onRegister?: (core: any) => void;
  onInit?: (core: any) => void;

  onNoteCreate?: (note: Note, core: any) => void;
  onNoteUpdate?: (note: Note, core: any) => void;
  onNoteDelete?: (id: string, core: any) => void;

  onSync?: (event: SyncEvent, core: any) => Promise<void>;
}
