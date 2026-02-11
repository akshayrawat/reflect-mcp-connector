export type ReflectUser = {
  uid: string;
  email: string;
  name: string;
  graph_ids: string[];
};

export type ReflectGraph = {
  id: string;
  name: string;
};

export type ReflectBookNote = {
  type: string;
  page: number;
  location: number;
  value: string;
};

export type ReflectBook = {
  id: string;
  asin: string;
  title: string;
  authors: string[];
  notes: ReflectBookNote[];
};

export type ReflectLink = {
  id: string;
  url: string;
  title: string;
  description: string;
  updated_at: string;
  highlights: string[];
};

export type ReflectSuccess = {
  success: boolean;
};

