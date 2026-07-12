/**
 * Mirrors portfolio-service's actual DTOs 1:1 (see
 * backend-service/src/main/java/com/example/portfolio/dto/*.java):
 *   - RealEstateProjectResponse / RealEstateProjectRequest
 *   - EnrichedRealEstateProjectResponse (wraps the base response, does not flatten it)
 */

export const PROPERTY_TYPES = [
  "OFFICE",
  "RETAIL",
  "RESIDENTIAL",
  "INDUSTRIAL",
  "LAND",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROJECT_STATUSES = [
  "ACTIVE",
  "UNDER_CONSTRUCTION",
  "HELD_FOR_SALE",
  "DISPOSED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Real values from fx-compliance-service's AmlRiskRating enum. */
export const AML_RISK_RATINGS = ["LOW", "MEDIUM", "HIGH"] as const;
export type AmlRiskRating = (typeof AML_RISK_RATINGS)[number];

/** Real values from valuation-service's MarketTrend enum. */
export const MARKET_TRENDS = ["RISING", "STABLE", "DECLINING"] as const;
export type MarketTrend = (typeof MARKET_TRENDS)[number];

/** Maps 1:1 to backend RealEstateProjectResponse. */
export interface RealEstateProjectResponse {
  id: number;
  projectName: string;
  countryCode: string;
  city: string;
  address: string;
  propertyType: PropertyType;
  sizeSqm: number;
  acquisitionDate: string; // ISO date, e.g. 2024-03-15
  acquisitionCost: number;
  acquisitionCurrency: string;
  ownerEntity: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/** Maps 1:1 to backend RealEstateProjectRequest — the create/update body. */
export type RealEstateProjectRequest = Omit<
  RealEstateProjectResponse,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Maps 1:1 to backend EnrichedRealEstateProjectResponse. Note this WRAPS the
 * base project under `property` rather than flattening it — portfolio-service
 * composes it from three downstream calls (valuation-service, fx-compliance's
 * FX + AML endpoints) via Mono.zip, so each enrichment field can independently
 * fall back to a sentinel value ("valuation unavailable" / "compliance
 * unavailable") with its own `*Unavailable` flag when that specific downstream
 * call fails or times out (see RealEstateProjectService.enrich). UI code
 * should branch on the boolean flags, not string-match the sentinel text.
 */
export interface EnrichedRealEstateProjectResponse {
  property: RealEstateProjectResponse;
  estimatedMarketValue: number | null;
  marketTrend: MarketTrend | string; // string covers the "valuation unavailable" sentinel
  valueUSD: number | null;
  amlRiskRating: AmlRiskRating | string; // string covers the "compliance unavailable" sentinel
  valuationUnavailable: boolean;
  fxUnavailable: boolean;
  complianceUnavailable: boolean;
}

/** Spring's default Page<T> JSON shape. */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page, 0-based
  size: number;
}

export interface PropertyQueryArgs {
  page: number; // 0-based, matches Spring Pageable
  pageSize: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  status?: ProjectStatus;
  propertyType?: PropertyType;
  countryCode?: string;
}
