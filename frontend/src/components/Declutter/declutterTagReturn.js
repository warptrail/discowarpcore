export function selectReviewCandidate(candidates, preferredId) {
  return candidates.find(candidate => preferredId && candidate.id === preferredId && candidate.needsMyVote)
    || candidates.find(candidate => candidate.needsMyVote) || null;
}
