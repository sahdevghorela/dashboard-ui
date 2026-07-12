import { baseApi } from "../../api/baseApi";
import type {
  EnrichedRealEstateProjectResponse,
  PagedResponse,
  RealEstateProjectRequest,
  RealEstateProjectResponse,
  PropertyQueryArgs,
} from "./types";

function toQueryString(args: PropertyQueryArgs): string {
  const params = new URLSearchParams();
  params.set("page", String(args.page));
  params.set("size", String(args.pageSize));
  if (args.sortField) {
    params.set("sort", `${args.sortField},${args.sortDirection ?? "asc"}`);
  }
  if (args.status) params.set("status", args.status);
  if (args.propertyType) params.set("propertyType", args.propertyType);
  if (args.countryCode) params.set("countryCode", args.countryCode);
  return params.toString();
}

/**
 * injectEndpoints keeps this feature's endpoints colocated with its
 * components/schema under src/features/properties, while still sharing
 * baseApi's single cache/store slice (see src/api/baseApi.ts).
 */
export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Grid data source (GET /properties/enriched). `providesTags` lists
     * every row's id plus a catch-all 'LIST' tag. A mutation only needs to
     * invalidate 'LIST' (create/delete, where the page's row count/order
     * can shift) or a specific id (update, where only that row's cached
     * data is stale) — RTK Query then refetches exactly the active queries
     * that were tagged, with no manual dispatch(refetch()) or useEffect
     * from the component.
     *
     * NOTE: as currently implemented, RealEstateProjectService.findAllEnriched
     * builds the Page's metadata (totalElements) from Pageable but slices
     * `content` from the *unpaged* full filtered list — so today this
     * endpoint returns every matching row on every page request rather than
     * one page's worth. The UI here still asks for the correct page/size
     * (matching the intended contract), so it will "just work" once that
     * backend method actually paginates content before enriching it.
     */
    getEnrichedProperties: builder.query<
      PagedResponse<EnrichedRealEstateProjectResponse>,
      PropertyQueryArgs
    >({
      query: (args) => `/properties/enriched?${toQueryString(args)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "EnrichedProperty" as const,
                id: p.property.id,
              })),
              { type: "EnrichedProperty" as const, id: "LIST" },
            ]
          : [{ type: "EnrichedProperty" as const, id: "LIST" }],
    }),

    getPropertyEnriched: builder.query<EnrichedRealEstateProjectResponse, number>({
      query: (id) => `/properties/${id}/enriched`,
      providesTags: (_result, _error, id) => [
        { type: "EnrichedProperty", id },
      ],
    }),

    createProperty: builder.mutation<
      RealEstateProjectResponse,
      RealEstateProjectRequest
    >({
      query: (body) => ({
        url: "/properties",
        method: "POST",
        body,
      }),
      // A new row changes the total count and default sort order, so the
      // whole list (every active page/filter combination) must be refetched.
      invalidatesTags: [{ type: "EnrichedProperty", id: "LIST" }],
    }),

    updateProperty: builder.mutation<
      RealEstateProjectResponse,
      { id: number; body: RealEstateProjectRequest }
    >({
      query: ({ id, body }) => ({
        url: `/properties/${id}`,
        method: "PUT",
        body,
      }),
      // Optimistic update: patch the cached grid page immediately so the
      // edit is visible before the network round trip resolves, then roll
      // back automatically if the PUT fails.
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled, getState }) {
        const patches: Array<{ undo: () => void }> = [];

        // Patch every currently-cached getEnrichedProperties page that
        // contains this row. selectCachedArgsForQuery gives us the exact
        // argument sets in the cache without guessing page/filter state.
        const cachedArgs = propertiesApi.util.selectCachedArgsForQuery(
          getState(),
          "getEnrichedProperties",
        );
        for (const args of cachedArgs) {
          const patch = dispatch(
            propertiesApi.util.updateQueryData(
              "getEnrichedProperties",
              args,
              (draft) => {
                const row = draft.content.find((p) => p.property.id === id);
                if (row) Object.assign(row.property, body);
              },
            ),
          );
          patches.push(patch);
        }

        const detailPatch = dispatch(
          propertiesApi.util.updateQueryData(
            "getPropertyEnriched",
            id,
            (draft) => {
              Object.assign(draft.property, body);
            },
          ),
        );
        patches.push(detailPatch);

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      // Still invalidate on settle: the server-computed fields this DTO
      // can't predict (estimatedMarketValue, amlRiskRating, marketTrend)
      // need a real refetch once the optimistic patch above has been
      // superseded.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "EnrichedProperty", id },
      ],
    }),

    deleteProperty: builder.mutation<void, number>({
      query: (id) => ({
        url: `/properties/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const cachedArgs = propertiesApi.util.selectCachedArgsForQuery(
          getState(),
          "getEnrichedProperties",
        );
        const patches = cachedArgs.map((args) =>
          dispatch(
            propertiesApi.util.updateQueryData(
              "getEnrichedProperties",
              args,
              (draft) => {
                draft.content = draft.content.filter(
                  (p) => p.property.id !== id,
                );
                draft.totalElements = Math.max(0, draft.totalElements - 1);
              },
            ),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      // Row count changed -> refetch the list tag so pagination totals
      // (totalElements/totalPages) resync with the server.
      invalidatesTags: [{ type: "EnrichedProperty", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEnrichedPropertiesQuery,
  useGetPropertyEnrichedQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
} = propertiesApi;
