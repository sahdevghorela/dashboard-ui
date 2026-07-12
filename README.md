# portfolio-dashboard

React 18 + TypeScript + Redux Toolkit (RTK Query) dashboard for the real estate
portfolio held by `portfolio-service`. Vite-powered, MUI X DataGrid for the
grid.

## Assumed backend contract

`backend-service` in this workspace is currently an empty Spring Boot module
(only `.idea` metadata + a stub `README.md`, no source yet). Since there's no
running `portfolio-service` to introspect, this UI was built against the
contract implied by the prompt, kept consistent with the field names already
used by the sibling `valuation-service` (`countryCode`, `sizeSqm`,
`acquisitionCurrency`, `propertyType`, ...) so a `PropertyDto` can be forwarded
to `valuation-service`'s `/valuations/estimate` without remapping fields.

Base URL: `http://localhost:8080/api/v1`

| Method | Path                          | Purpose                                   |
|--------|-------------------------------|--------------------------------------------|
| GET    | `/properties/enriched`        | Paginated grid rows, enriched with valuation + AML fields. Query params: `page`, `size`, `sort=field,asc\|desc`, `status`, `propertyType`, `countryCode` |
| GET    | `/properties/{id}/enriched`   | Single enriched property (detail drawer)   |
| POST   | `/properties`                 | Create                                     |
| PUT    | `/properties/{id}`            | Update                                     |
| DELETE | `/properties/{id}`            | Delete                                     |

Response shape for paginated endpoints is Spring's default `Page<T>` JSON
(`content`, `totalElements`, `totalPages`, `number`, `size`) — see
[src/features/properties/types.ts](src/features/properties/types.ts).

If `portfolio-service`'s actual field names or paging envelope differ once
that service exists, the only files that need to change are
[types.ts](src/features/properties/types.ts) (DTO shapes),
[propertiesApi.ts](src/features/properties/propertiesApi.ts) (query strings),
and [propertySchema.ts](src/features/properties/propertySchema.ts) (validation
rules) — components never talk to the network directly.

## Folder structure

```
src/
  api/
    baseApi.ts          # single RTK Query root (fetchBaseQuery + tagTypes)
  app/
    store.ts            # configureStore, combines ui slice + baseApi
    hooks.ts             # typed useAppDispatch / useAppSelector
  features/
    properties/
      types.ts           # PropertyDto, EnrichedPropertyDto, PagedResponse<T>
      propertySchema.ts   # Zod schema mirroring backend bean validation
      propertiesApi.ts    # injectEndpoints: list/get/create/update/delete + tags
      PropertiesPage.tsx  # landing page composition
      PropertiesGrid.tsx  # MUI DataGrid, server-side pagination/sort
      PropertiesFilters.tsx # status/propertyType/country filter bar + Add button
      PropertyFormModal.tsx # add/edit modal, RHF + Zod, optimistic update
      DeleteConfirmDialog.tsx
      PropertyDetailDrawer.tsx # enriched view drawer
      RiskBadge.tsx        # green/amber/red AML chip
      __tests__/PropertyFormModal.test.tsx
    ui/
      uiSlice.ts          # plain RTK slice: modal/drawer open state + filters
  App.tsx                 # theme, CssBaseline, SnackbarProvider
  main.tsx                # ReactDOM root, Redux Provider
```

## Grid library: MUI X DataGrid vs AG Grid

Went with **MUI X DataGrid (Community)**. Tradeoff considered:

- The rest of the UI (dialogs, drawer, form, buttons, chips) is already MUI —
  DataGrid shares the same theme, so density, colors, and typography match
  the surrounding chrome for free. AG Grid brings its own theming system
  (CSS classes / `ag-theme-*`) that has to be hand-reconciled with MUI's
  `ThemeProvider` to not look like two different products glued together.
- This grid's requirements — server-side pagination, sorting, a couple of
  enum filters, one custom cell renderer (the risk badge) — sit squarely in
  what DataGrid Community supports for free via `paginationMode="server"` /
  `sortingMode="server"`. AG Grid's more powerful server-side row model
  (infinite block loading, row grouping against a server, pivoting) is real,
  but it's an Enterprise-licensed feature; using AG Grid here would mean
  either paying for Enterprise or building the same pagination-mode data
  fetching DataGrid already gives for free.
- AG Grid Community is generally faster on very large in-memory row counts
  and has a broader plugin ecosystem — if this grid needed 100k+ rows
  rendered client-side, or Excel-style pivoting, that would tip the decision
  the other way.

## Cache invalidation (why the grid stays in sync)

`propertiesApi.ts` tags every row from `getEnrichedProperties` with
`{ type: 'EnrichedProperty', id: <row id> }` plus one shared
`{ type: 'EnrichedProperty', id: 'LIST' }` tag.

- **Create / Delete** invalidate only the `'LIST'` tag, because the *set* of
  rows changed — a new row appears, or the total row count shrinks, which can
  shift which rows belong on which page. RTK Query refetches every currently
  mounted query that provided that tag (i.e. the active grid page/filter
  combination), automatically, with no `dispatch(refetch())` anywhere in a
  component.
- **Update** invalidates just that row's `{ type: 'EnrichedProperty', id }`
  tag — the row count/order is unaffected, so only that one cached object
  needs to be considered stale.
- On top of invalidation, `updateProperty` and `deleteProperty` also run an
  **optimistic update** in `onQueryStarted`: they patch every currently
  cached `getEnrichedProperties` page (found via
  `propertiesApi.util.selectCachedArgsForQuery`) and the cached detail query
  immediately, so the UI reflects the edit/delete before the network request
  resolves. If the request fails, the patch is rolled back via the `undo()`
  handle RTK Query returns. The tag invalidation still runs after success so
  that server-computed fields the client can't predict (estimated market
  value, AML risk rating, trend) get a real refetch rather than staying at
  their optimistic (stale) values.

This is also why a plain Redux + `useEffect` + Axios approach needs
noticeably more code for the same behavior: with thunks, each component (or a
hand-written cache layer) would have to track its own `loading`/`error`
booleans, remember to dispatch a refetch after every mutation, and hand-roll
the optimistic patch/rollback bookkeeping that `onQueryStarted` + tag
invalidation give here for free. RTK Query's `useGetEnrichedPropertiesQuery`
hook already returns `{ data, isFetching, isError, error }` derived from a
normalized cache keyed by serialized query args — no `useEffect` fetch-on-
mount, no manual deduping of identical in-flight requests, no cleanup logic
for stale requests when `queryArgs` changes rapidly (e.g. fast pagination
clicks).

## Yup/Zod schema vs backend bean validation

[propertySchema.ts](src/features/properties/propertySchema.ts) mirrors the
bean validation annotations assumed on portfolio-service's
`PropertyUpsertDto`:

| Zod rule | Assumed bean validation | Field |
|---|---|---|
| `.min(1)` | `@NotBlank` | name, city |
| `.max(200)` / `.max(100)` | `@Size(max = ...)` | name, city |
| `.length(2)` | `@Size(min = 2, max = 2)` | countryCode (ISO 3166-1 alpha-2) |
| `.length(3)` | `@Size(min = 3, max = 3)` | acquisitionCurrency (ISO 4217) |
| `z.enum([...])` | `@NotNull` on a Java enum field | propertyType, status |
| `.positive()` | `@Positive` | sizeSqm |
| `.nonnegative()` | `@PositiveOrZero` | acquisitionCost |
| `.refine(date <= now)` | `@PastOrPresent` | acquisitionDate |

The point of keeping these in lockstep is that a `400` from the server should
only happen when this file is missing a rule the backend enforces — not
because the two layers disagree about what's valid. If/when the real
`portfolio-service` DTO's annotations are confirmed, update this table and
the schema together.

## Environment

Copy `.env.example` to `.env` (already present, pointed at
`http://localhost:8080/api/v1`) and adjust `VITE_API_BASE_URL` if
`portfolio-service` runs elsewhere. It's read once in
[src/api/baseApi.ts](src/api/baseApi.ts) via `import.meta.env.VITE_API_BASE_URL`.

## Running

This environment didn't have Node/npm on `PATH`, so dependencies were never
installed or built here — install Node 18+ and run these on your machine:

```bash
npm install
npm run dev        # http://localhost:5173
```

Start `portfolio-service` (from Prompt 3) first so it's listening on
`http://localhost:8080` — e.g. `mvn spring-boot:run` from that module,
mirroring how `valuation-service` runs on 8081 (see
[../../valuation-service/valuation-service/README.md](../../valuation-service/valuation-service/README.md)).
CORS: if the backend doesn't already allow `http://localhost:5173`, add a
`@CrossOrigin` / global CORS config for that origin, since `fetchBaseQuery`
calls it directly (no dev-server proxy is configured).

```bash
npm run test        # vitest run, includes PropertyFormModal validation tests
npm run build        # tsc -b && vite build
npm run lint
```
