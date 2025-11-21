import { z } from "zod";

// Geometry validation
export const GeometrySchema = z.object({
  x: z.number().min(0).max(100000),
  y: z.number().min(0).max(100000),
  w: z.number().min(50).max(5000),
  h: z.number().min(50).max(5000),
  z: z.number().int().min(0),
});

// Note validation
export const NoteSchema = z.object({
  id: z.string().uuid(),
  geometry: GeometrySchema,
  contentHTML: z.string().max(10 * 1024 * 1024), // 10MB max
  tags: z.array(z.string().max(50)).max(20), // Max 20 tags, each max 50 chars
  color: z.string().max(50),
  linkedAssets: z.array(z.string().uuid()),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// Asset validation
export const AssetSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["image", "video", "audio", "file", "code"]),
  path: z.string().max(2048).optional(),
  mime: z.string().max(100),
  metadata: z.record(z.any()),
});

// Playlist validation
export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  tracks: z.array(z.string().uuid()),
  metadata: z.record(z.any()),
});

// Board validation
export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  theme: z.string().max(50),
  notes: z.array(NoteSchema).max(10000), // Max 10k notes per board
  assets: z.array(AssetSchema).max(10000), // Max 10k assets per board
  playlists: z.array(PlaylistSchema).max(1000), // Max 1k playlists per board
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// Partial schemas for updates
export const PartialNoteSchema = NoteSchema.partial().extend({
  id: z.string().uuid().optional(),
  geometry: GeometrySchema.partial().optional(),
});

export const PartialBoardSchema = BoardSchema.partial().extend({
  id: z.string().uuid().optional(),
});

// Validation functions
export function validateNote(data: unknown): asserts data is z.infer<typeof NoteSchema> {
  NoteSchema.parse(data);
}

export function validateBoard(data: unknown): asserts data is z.infer<typeof BoardSchema> {
  BoardSchema.parse(data);
}

export function validatePartialNote(data: unknown): z.infer<typeof PartialNoteSchema> {
  return PartialNoteSchema.parse(data);
}

export function validatePartialBoard(data: unknown): z.infer<typeof PartialBoardSchema> {
  return PartialBoardSchema.parse(data);
}

