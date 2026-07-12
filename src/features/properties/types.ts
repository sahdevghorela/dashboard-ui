/**
 * Mirrors portfolio-service's bean-validated request/response DTOs.
 * Field names (countryCode, sizeSqm, acquisitionCurrency, ...) match
 * valuation-service's benchmark DTOs so a PropertyDto can be forwarded
 * to /valuations/estimate without remapping.
 */

export const PROPERTY_TYPES = [
  "OFFICE",
  "RETAIL",
  "RESIDENTIAL",
  "INDUSTRIAL",
  "HOTEL",
  "MIXED_USE",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  "ACTIVE",
  "UNDER_CONTRACT",
  "SOLD",
  "ARCHIVED",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const RISK_RATINGS = ["GREEN", "AMBER", "RED"] as const;
export type RiskRating = (typeof RISK_RATINGS)[number];

export const VALUATION_TRENDS = ["UP", "DOWN", "STABLE"] as const;
export type ValuationTrend = (typeof VALUATION_TRENDS)[number];

/** Maps 1:1 to backend PropertyDto (request + response body). */
export interface PropertyDto {
  id: number;
  name: string;
  countryCode: string;
  city: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  sizeSqm: number;
  acquisitionCost: number;
  acquisitionCurrency: string;
  acquisitionDate: string; // ISO date, e.g. 2024-03-15
  createdAt?: string;
  updatedAt?: string;
}

/** Payload accepted by POST/PUT — server assigns id/createdAt/updatedAt. */
export type PropertyUpsertDto = Omit<
  PropertyDto,
  "id" | "createdAt" | "updatedAt"
>;

/** Returned by GET /properties/enriched and /properties/{id}/enriched. */
export interface EnrichedPropertyDto extends PropertyDto {
  estimatedMarketValue: number;
  marketValueCurrency: string;
  valuationConfidence: "HIGH" | "MEDIUM" | "LOW";
  trend: ValuationTrend;
  amlRiskRating: RiskRating;
  amlRiskScore?: number;
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
  status?: PropertyStatus;
  propertyType?: PropertyType;
  countryCode?: string;
}
