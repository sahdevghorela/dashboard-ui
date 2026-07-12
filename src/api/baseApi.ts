import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // Fail loudly at startup rather than silently hitting a relative path.
  console.warn(
    "VITE_API_BASE_URL is not set — falling back to http://localhost:8080/api/v1",
  );
}

/**
 * Single RTK Query root. Feature slices (see src/features/properties/propertiesApi.ts)
 * call `baseApi.injectEndpoints(...)` instead of each defining their own `createApi`,
 * so there is exactly one cache, one middleware, and one set of tag types for the
 * whole app — this is what lets a mutation in one feature invalidate a query defined
 * in another.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL ?? "http://localhost:8080/api/v1",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Property", "EnrichedProperty"],
  endpoints: () => ({}),
});
