export type CardStyle = 'wish' | 'memory' | 'letter' | 'secret';

export type PaperTone = 'cream' | 'butter' | 'blush' | 'lavender' | 'sky';

export type TapeStyle = 'striped' | 'dots' | 'grid' | 'clip';

export interface Wall {
  wallId: string;
  title: string;
  description: string;
  isOpen: boolean;
  createdAt: string;
}

export interface ScrapbookPost {
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

export interface AdminStats {
  totalPosts: number;
  visibleCount: number;
  hiddenCount: number;
  totalLikes: number;
}

export const ANONYMOUS_LABEL = 'Ai đó rất dễ thương';
export const DEFAULT_WALL_ID = 'nam-hoa';
export const MAX_IMAGES_PER_POST = 4;
export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_SENDER_NAME_LENGTH = 60;
