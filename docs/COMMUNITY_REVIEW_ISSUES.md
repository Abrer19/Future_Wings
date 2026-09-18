# Community Reviews Backlog

These issues track follow-up work for the new Community reviews experience.

## 1. Add Review Editing

Allow users to edit their own submitted reviews.

Acceptance criteria:
- A user can update only reviews where `Rating.UserId` matches their JWT user id.
- The UI exposes edit/cancel/save states from the Community page.
- Validation keeps score between 1 and 5 and comment length within the current limit.

## 2. Add Review Deletion

Allow users to delete their own reviews.

Acceptance criteria:
- A delete endpoint scopes by authenticated user id.
- The Community list updates without a full page refresh.
- The UI asks for confirmation before deleting.

## 3. Prevent Duplicate Reviews Per University

Decide whether one user should have one review per university, then enforce it.

Acceptance criteria:
- A database-level unique constraint protects `(UserId, UniversityId)` if duplicates are disallowed.
- The submit flow updates the existing review or returns a clear conflict.
- The UI explains the rule before submission.

## 4. Add Review Dates

Store and show when reviews were created and last updated.

Acceptance criteria:
- `Rating` stores `CreatedAt` and `UpdatedAt`.
- Review responses include those timestamps.
- The Community list displays friendly dates.

## 5. Add Review Moderation

Give admins a way to hide or restore inappropriate reviews.

Acceptance criteria:
- Ratings support a moderation status such as `Visible`, `Hidden`, or `Flagged`.
- Admin APIs can change moderation status.
- Student-facing APIs return only visible reviews.

## 6. Add Report Review Flow

Let students report a review for moderation.

Acceptance criteria:
- Signed-in users can report a review with a reason.
- Duplicate reports by the same user are prevented.
- Admins can see report counts and reasons.

## 7. Add University Review Aggregates

Expose aggregate review data for catalog cards.

Acceptance criteria:
- Discovery or a dedicated endpoint returns average rating and review count per university.
- Community does not need to load every review to show summary data.
- Empty universities show a neutral unrated state.

## 8. Add Dedicated University Directory Endpoint

Replace Community's current university list derivation from Discovery programs.

Acceptance criteria:
- A dedicated endpoint returns university id, name, city, country, program count, average rating, and review count.
- The endpoint supports search and country filtering.
- Community uses the new endpoint instead of deduplicating programs client-side.

## 9. Add Review Sorting And Filtering

Let users find useful reviews faster.

Acceptance criteria:
- Sort by newest, highest rating, lowest rating, and current user's review.
- Filter by score.
- Sorting and filtering work without losing the selected university.

## 10. Add API And UI Tests For Reviews

Cover the review workflow with automated tests.

Acceptance criteria:
- Service tests cover create, list, invalid score, missing university, and user scoping.
- Controller/integration tests verify auth is required.
- Frontend tests cover loading, empty state, submission success, and submission error.
