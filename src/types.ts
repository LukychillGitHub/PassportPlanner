export type Activity = {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
};

export type Stamp = {
  activityId: string;
  rating: number; // 1 a 5
  note: string;
  photoUris: string[];
  stampedAt: number;
};

export type Profile = {
  name: string;
  bio: string;
  photoUri: string | null;
};

export type Passport = {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
};

export type Companion = {
  userId: string;
  name: string;
  bio: string;
  photoUri: string | null;
};

export type Top = {
  id: string;
  title: string;
  emoji: string;
  createdBy: string | null;
  createdAt: number;
};

export type TopCategory = {
  id: string;
  topId: string;
  name: string;
  sortOrder: number;
};

export type TopPlace = {
  id: string;
  topId: string;
  name: string;
  createdBy: string | null;
  createdAt: number;
};

// El orden de una persona en una categoría, del 1º al último.
export type TopRanking = {
  categoryId: string;
  userId: string;
  topId: string;
  placeIds: string[];
};

export type CompanionRating = {
  raterId: string;
  rateeId: string;
  rating: number; // 1 a 5
  note: string;
  updatedAt: number;
};
