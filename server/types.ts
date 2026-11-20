export type CardStyle = 'wish' | 'memory' | 'letter' | 'secret';

export type PaperTone = 'cream' | 'butter' | 'blush' | 'lavender' | 'sky';

export type TapeStyle = 'striped' | 'dots' | 'grid' | 'clip';

export interface WallRecord {
  wallId: string;
  title: string;
  description: string;
  isOpen: boolean;
  createdAt: string;
}

export interface PostRecord {
  postId: string;
  wallId: string;
  senderName: string;
  isAnonymous: boolean;
  message: string;
  imageUrls: string[];
  cardStyle: CardStyle;
  paperTone: PaperTone;
  tapeStyle: TapeStyle;
  tiltDeg: number;
  createdAt: string;
  likesByVisitor: Record<string, string>;
  likeCount: number;
  isHidden: boolean;
}

export interface PublicPostDTO {
  postId: string;
  wallId: string;
  senderDisplay: string;
  isAnonymous: boolean;
  message: string;
  imageUrls: string[];
  cardStyle: CardStyle;
  paperTone: PaperTone;
  tapeStyle: TapeStyle;
  tiltDeg: number;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isHidden?: boolean;
}

export interface DatabaseSchema {
  walls: Record<string, WallRecord>;
  posts: PostRecord[];
}

export const ANONYMOUS_DISPLAY_NAME = 'Ai đó rất dễ thương';
export const DEFAULT_WALL_ID = 'nam-hoa';
export const MAX_IMAGES_PER_POST = 4;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_SENDER_NAME_LENGTH = 60;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
