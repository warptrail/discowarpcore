# Hashtag inventory collections

Every read-only tag is an individual `#tag` link. Opening it navigates to
`/tag/<encoded-tag-name>`, a virtual inventory collection using the Retrieval
workspace. Existing `/tags/:tag` links continue to work.

- **Items** lists active item records carrying the exact tag.
- **Boxes** lists physical boxes carrying that tag on their own record. A tag
  on a contained item does not tag its box.
- Search narrows the current collection. Sort, cards, terminal view, pagination,
  item inspectors, box inspections and browser Back/Forward retain Retrieval's
  normal behavior. Clearing filters keeps the route's tag scope.
- Names are normalized to lowercase and URL-encoded. Spaces, commas, slashes
  and Unicode remain part of one exact tag, rather than a text-search query.
- The collection never changes placement, quantity or physical-box membership
  and does not create a Box document.

Retrieval Overview and Data show navigable hashtags alongside a separate
**Edit tags** control. Existing tag editors still stage additions/removals and
retain Cancel, Save, duplicate handling and unsaved-change protection.

Links use compact Prism navy chips, quiet box-colored edges, wrapping labels
and cyan keyboard focus. Read-only displays share `TagLinks`; the canonical
URL helper is `util/tagNavigation.js`. Editable chips and tag filter controls
keep their existing editing/filtering purpose.

The Retrieval APIs accept optional `exactTag` for a single literal tag. Box
Retrieval additionally accepts `tagSource=box` for direct box-tag filtering;
ordinary box Retrieval continues to filter by contained-item tags.

Verification uses synthetic service/UI fixtures in `test/tagNavigation.test.js`.
Live checks are read-only; no inventory records are created for visual QA.

The console uses one dominant **Tag: #name** permalink, with an adjacent Back
link. Hashtag navigation remembers the source URL (including query and hash),
its history entry, scroll position and expanded Operations Quick Peek. Back
returns to that entry rather than adding a duplicate route. Retrieval also
retains its search, filters, results view, selected item and inspector tab.
Browser Back uses the same source snapshot. A directly opened tag URL offers
Retrieval as its fallback; modifier-clicks retain ordinary link behavior.

Collections can combine tags. The first tag stays in the path; additional tags
use repeated `tag` query parameters and `match=and` or `match=or`, for example
`/tag/glass?tag=pendant&match=and`. These URLs work after reload and can be shared.
Use the header's Tags control to add/remove tags and switch ALL (AND) or ANY
(OR). Keep at least one tag. Changes replace the collection URL and retain the
original Back destination. Removing the first tag promotes the next tag into
the path. Items match their own tags; Boxes match their own box tags.
The exact-tag API accepts repeated `exactTag` parameters, preserving punctuation
inside each literal tag. Existing single-tag and ordinary CSV filters work.

Editing the collection (adding/removing tags or changing AND/OR) replaces only
the current tag entry and preserves its complete original return snapshot.
Promoting a different first tag does the same. Back remains one step to the
source box/item view, including its selected record, scroll and open tag bubble.
Regression tests exercise this with the actual memory router for Operations,
item-page and box-page origins.

Reloading a tag page retains its Back destination in browser history state.
The source record's complete return snapshot is also stored in session storage,
so returning after a full reload restores selections, page/internal scroll and
the open tag popup even though the in-memory cache has been cleared. Tests load
a fresh copy of the snapshot module to verify this cold-start path.
