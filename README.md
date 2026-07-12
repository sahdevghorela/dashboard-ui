# portfolio-dashboard

React 18 + TypeScript + Redux Toolkit (RTK Query) dashboard for the real estate
portfolio held by `portfolio-service` (`backend-service` in this workspace).
Vite-powered, MUI X DataGrid for the grid.

## Backend contract

`backend-service`'s source (`com.example.portfolio`) was read directly to
confirm this — it's not assumed. Base URL: `http://localhost:8080/api/v1`.

| Method | Path                          | Purpose                                   |
|--------|-------------------------------|--------------------------------------------|
| GET    | `/properties`                 | Plain paginated list (not used by the grid, which needs the enriched fields) |
| GET    | `/properties/enriched`        | Paginated grid rows, enriched with valuation/FX/AML fields. Query params: `page`, `size`, `sort=field,asc\|desc`, `status`, `propertyType`, `countryCode` |
| GET    | `/properties/{id}/enriched`   | Single enriched property (detail drawer)   |
| POST   | `/properties`                 | Create                                     |
| PUT    | `/properties/{id}`            | Update                                     |
| DELETE | `/properties/{id}`            | Delete                                     |

`RealEstateProjectResponse` (`property` in the enriched shape):
`id`, `projectName`, `countryCode`, `city`, `address`, `propertyType`
(`OFFICE`/`RETAIL`/`RESIDENTIAL`/`INDUSTRIAL`/`LAND`), `sizeSqm`,
`acquisitionDate`, `acquisitionCost`, `acquisitionCurrency`, `ownerEntity`,
`status` (`ACTIVE`/`UNDER_CONSTRUCTION`/`HELD_FOR_SALE`/`DISPOSED`),
`createdAt`, `updatedAt`.

`EnrichedRealEstateProjectResponse` **wraps** the base response rather than
flattening it — `{ property, estimatedMarketValue, marketTrend, valueUSD,
amlRiskRating, valuationUnavailable, fxUnavailable, complianceUnavailable }`.
It's composed from three parallel downstream calls
(`RealEstateProjectService.enrich`, via `Mono.zip`):

- `valuation-service` → `estimatedMarketValue` (in the property's own
  `acquisitionCurrency`, not USD) + `marketTrend` (`RISING`/`STABLE`/`DECLINING`)
- `fx-compliance-service` (the `risk-service` module) → `valueUSD`, which is
  the **acquisition cost** FX-converted to USD — it is not a USD version of
  `estimatedMarketValue`
- `fx-compliance-service` → `amlRiskRating` (`LOW`/`MEDIUM`/`HIGH`), by country

Each of the three calls degrades independently: if a downstream call fails,
its field is set to a sentinel string (`"valuation unavailable"` /
`"compliance unavailable"`) and the matching `*Unavailable` boolean is set
`true`. The UI branches on those booleans, never on the sentinel text — see
`RiskBadge.tsx` and `PropertyDetailDrawer.tsx`.

**⚠️ Known backend issue** (not fixed here, since it's outside this UI
module): `RealEstateProjectService.findAllEnriched` builds the returned
`Page`'s `content` from the *entire* filtered list
(`repository.findAll(spec)`, no `Pageable` passed) and only uses `Pageable`
for the `PageImpl` metadata (`totalElements`). Practically, `GET
/properties/enriched` currently returns every matching row regardless of
`page`/`size`, and ignores the `sort` param entirely (the non-enriched `GET
/properties` endpoint does not have this bug). The grid here still requests
the correct `page`/`size`/`sort` args, so it will work correctly with no UI
changes once that method is updated to slice/sort before enriching — until
then, expect the grid to show more rows per page than requested.

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
      types.ts           # RealEstateProjectResponse/Request, EnrichedRealEstateProjectResponse
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
- One consequence of the response being nested (`{ property, ...enrichment
  }`) rather than flat: DataGrid rows need `getRowId={(row) =>
  row.property.id}` and each column needs a `valueGetter` reaching into
  `row.property.*`, since DataGrid doesn't auto-resolve dotted `field` paths.

## Cache invalidation (why the grid stays in sync)

`propertiesApi.ts` tags every row from `getEnrichedProperties` with
`{ type: 'EnrichedProperty', id: <row.property.id> }` plus one shared
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
  immediately (patching `row.property`, since that's the part of the
  response the client actually knows the new value of), so the UI reflects
  the edit/delete before the network request resolves. If the request fails,
  the patch is rolled back via the `undo()` handle RTK Query returns. The tag
  invalidation still runs after success so that server-computed fields the
  client can't predict (`estimatedMarketValue`, `amlRiskRating`,
  `marketTrend`) get a real refetch rather than staying at their optimistic
  (stale) values.

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

## Zod schema vs backend bean validation

[propertySchema.ts](src/features/properties/propertySchema.ts) mirrors the
actual bean validation annotations on
`RealEstateProjectRequest`/`RealEstateProject` in `backend-service`:

| Zod rule | Backend bean validation | Field |
|---|---|---|
| `.min(1)` | `@NotBlank` | projectName, city, address, ownerEntity |
| `.max(150)` / `.max(100)` / `.max(250)` / `.max(120)` | `@Size(max = ...)` | projectName, city, address, ownerEntity respectively |
| `.length(2)` | `@Size(min = 2, max = 2)` | countryCode (ISO 3166-1 alpha-2) |
| `.length(3)` | `@Size(min = 3, max = 3)` | acquisitionCurrency (ISO 4217) |
| `z.enum([...])` | `@NotNull` on a Java enum field | propertyType, status |
| `.min(0.01)` | `@DecimalMin("0.01")` | sizeSqm, acquisitionCost |
| `.refine(date <= now)` | `@PastOrPresent` | acquisitionDate |

Keeping these in lockstep means a `400` from the server should only happen
when this file is missing a rule the backend enforces — not because the two
layers disagree about what's valid. `GlobalExceptionHandler` returns
`{ fieldErrors: { field: message } }` on a `MethodArgumentNotValidException`
(400); the form currently surfaces the caught error's top-level `message`
in a snackbar, not per-field server errors, since client-side validation
already blocks every case the backend rejects.

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

Start all three backend services first (`backend-service` depends on the
other two for the `/enriched` endpoints):

```bash
# from backend-service/       (portfolio-service, port 8080)
mvn spring-boot:run

# from valuation-service/valuation-service/   (port 8081)
mvn spring-boot:run

# from risk-service/risk-service/  (fx-compliance-service, port 8082)
mvn spring-boot:run
```

CORS is already configured in `backend-service`'s `CorsConfig` for
`http://localhost:3000` and `http://localhost:5173` — no changes needed there
for the default Vite dev server port.

```bash
npm run test        # vitest run, includes PropertyFormModal validation tests
npm run build        # tsc -b && vite build
npm run lint
```
