// types/presentation.ts
export const PRESENTATION_ROLES = ["judge", "dr", "admin", "all"] as const;
export type PresentationRole = typeof PRESENTATION_ROLES[number];

export const CONTENT_TYPES = ["TEXT", "IMAGE", "VIDEO", "FILE"] as const;
export type ContentType = typeof CONTENT_TYPES[number];