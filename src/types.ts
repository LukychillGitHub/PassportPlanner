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
  photoUri: string | null;
  stampedAt: number;
};

export type Profile = {
  name: string;
  bio: string;
  photoUri: string | null;
};
