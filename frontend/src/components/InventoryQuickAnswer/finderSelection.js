// The deep link is the current expanded match, not a second carousel selection.
export function getFinderCarouselIndex(answers, query, selection, focusedId) {
  const focused = focusedId ? answers.findIndex(({ id }) => id === focusedId) : -1;
  if (focused >= 0) return focused;
  return selection.query === query ? Math.max(0, answers.findIndex(({ id }) => id === selection.id)) : 0;
}
