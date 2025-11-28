"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialBoardSchema = exports.PartialNoteSchema = exports.BoardSchema = exports.PlaylistSchema = exports.AssetSchema = exports.NoteSchema = exports.GeometrySchema = void 0;
exports.validateNote = validateNote;
exports.validateBoard = validateBoard;
exports.validatePartialNote = validatePartialNote;
exports.validatePartialBoard = validatePartialBoard;
const zod_1 = require("zod");
// Geometry validation
exports.GeometrySchema = zod_1.z.object({
    x: zod_1.z.number().min(0).max(100000),
    y: zod_1.z.number().min(0).max(100000),
    w: zod_1.z.number().min(50).max(5000),
    h: zod_1.z.number().min(50).max(5000),
    z: zod_1.z.number().int().min(0),
});
// Note validation
exports.NoteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    geometry: exports.GeometrySchema,
    contentHTML: zod_1.z.string().max(10 * 1024 * 1024), // 10MB max
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20), // Max 20 tags, each max 50 chars
    color: zod_1.z.string().max(50),
    linkedAssets: zod_1.z.array(zod_1.z.string().uuid()),
    createdAt: zod_1.z.number().int().positive(),
    updatedAt: zod_1.z.number().int().positive(),
});
// Asset validation
exports.AssetSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(["image", "video", "audio", "file", "code"]),
    path: zod_1.z.string().max(2048).optional(),
    mime: zod_1.z.string().max(100),
    metadata: zod_1.z.record(zod_1.z.any()),
});
// Playlist validation
exports.PlaylistSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tracks: zod_1.z.array(zod_1.z.string().uuid()),
    metadata: zod_1.z.record(zod_1.z.any()),
});
// Board validation
exports.BoardSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(200),
    theme: zod_1.z.string().max(50),
    notes: zod_1.z.array(exports.NoteSchema).max(10000), // Max 10k notes per board
    assets: zod_1.z.array(exports.AssetSchema).max(10000), // Max 10k assets per board
    playlists: zod_1.z.array(exports.PlaylistSchema).max(1000), // Max 1k playlists per board
    createdAt: zod_1.z.number().int().positive(),
    updatedAt: zod_1.z.number().int().positive(),
});
// Partial schemas for updates
exports.PartialNoteSchema = exports.NoteSchema.partial().extend({
    id: zod_1.z.string().uuid().optional(),
    geometry: exports.GeometrySchema.partial().optional(),
});
exports.PartialBoardSchema = exports.BoardSchema.partial().extend({
    id: zod_1.z.string().uuid().optional(),
});
// Validation functions
function validateNote(data) {
    exports.NoteSchema.parse(data);
}
function validateBoard(data) {
    exports.BoardSchema.parse(data);
}
function validatePartialNote(data) {
    return exports.PartialNoteSchema.parse(data);
}
function validatePartialBoard(data) {
    return exports.PartialBoardSchema.parse(data);
}
