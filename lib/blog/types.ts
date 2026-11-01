export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readingTimeMinutes: number;
  coverImageSrc: string;
  coverAlt: string;
};

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = BlogPostMeta & {
  blocks: BlogBlock[];
};
