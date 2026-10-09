type TransitionLine = { before: string; keyword: string; after: string }
type TransitionCopy = { key: string; lines: [TransitionLine, TransitionLine] }

const copy: Record<string, TransitionCopy["lines"]> = {
  home: [
    { before: "Writing about ", keyword: "technology", after: "," },
    { before: "and about ", keyword: "life", after: "." },
  ],
  notes: [
    { before: "A notebook of ", keyword: "ideas", after: "," },
    { before: "a quiet trail of ", keyword: "curiosity", after: "." },
  ],
  learning: [
    { before: "Small steps of ", keyword: "curiosity", after: "," },
    { before: "a lifetime of ", keyword: "discovery", after: "." },
  ],
  projects: [
    { before: "Where ", keyword: "ideas", after: " take shape," },
    { before: "and ", keyword: "imagination", after: " finds a home." },
  ],
  friends: [
    { before: "Kindred ", keyword: "souls", after: "," },
    { before: "under the same ", keyword: "stars", after: "." },
  ],
  messages: [
    { before: "Leave a little ", keyword: "warmth", after: "," },
    { before: "in this corner of the ", keyword: "world", after: "." },
  ],
  about: [
    { before: "A life in ", keyword: "fragments", after: "," },
    { before: "a heart full of ", keyword: "wonder", after: "." },
  ],
  thoughts: [
    { before: "Passing ", keyword: "thoughts", after: "," },
    { before: "small ", keyword: "echoes", after: " of the everyday." },
  ],
  timeline: [
    { before: "Traces of ", keyword: "time", after: "," },
    { before: "stories along the ", keyword: "way", after: "." },
  ],
  article: [
    { before: "Between the ", keyword: "lines", after: "," },
    { before: "a world of ", keyword: "ideas", after: "." },
  ],
}

export function getTransitionCopy(pathname: string): TransitionCopy {
  const parts = pathname.split("/").filter(Boolean)
  let key = parts[0] || "home"
  if (key === "posts" || (key === "notes" && parts.length > 1) || (key === "life" && parts.length > 1)) key = "article"
  if (["articles", "life", "tags", "categories", "archives", "search"].includes(key)) key = "notes"
  return { key: key in copy ? key : "home", lines: copy[key] || copy.home }
}
