import { z } from "zod";
import { PROJECT_STATUSES, PROPERTY_TYPES } from "./types";

/**
 * Mirrors the bean validation annotations on portfolio-service's
 * RealEstateProjectRequest record (backend-service/.../dto/RealEstateProjectRequest.java):
 *
 *   @NotBlank @Size(max = 150)        String projectName;
 *   @NotBlank @Size(min = 2, max = 2) String countryCode;      // ISO 3166-1 alpha-2
 *   @NotBlank @Size(max = 100)        String city;
 *   @NotBlank @Size(max = 250)        String address;
 *   @NotNull                          PropertyType propertyType;
 *   @NotNull @DecimalMin("0.01")      BigDecimal sizeSqm;
 *   @NotNull @PastOrPresent           LocalDate acquisitionDate;
 *   @NotNull @DecimalMin("0.01")      BigDecimal acquisitionCost;
 *   @NotBlank @Size(min = 3, max = 3) String acquisitionCurrency; // ISO 4217
 *   @NotBlank @Size(max = 120)        String ownerEntity;
 *   @NotNull                          ProjectStatus status;
 *
 * Keeping these two schemas in lockstep means a 400 from the server should
 * only ever happen on a rule this file forgot to encode, not on a rule the
 * two sides disagree about.
 */
export const propertySchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(150, "Project name must be 150 characters or fewer"),
  countryCode: z
    .string()
    .trim()
    .length(2, "Use a 2-letter ISO country code (e.g. US)")
    .transform((v) => v.toUpperCase()),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(250, "Address must be 250 characters or fewer"),
  propertyType: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: "Select a property type" }),
  }),
  status: z.enum(PROJECT_STATUSES, {
    errorMap: () => ({ message: "Select a status" }),
  }),
  sizeSqm: z.coerce
    .number({ invalid_type_error: "Size is required" })
    .min(0.01, "Size must be at least 0.01 sqm"),
  acquisitionDate: z
    .string()
    .min(1, "Acquisition date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => new Date(v) <= new Date(), "Date cannot be in the future"),
  acquisitionCost: z.coerce
    .number({ invalid_type_error: "Acquisition cost is required" })
    .min(0.01, "Acquisition cost must be at least 0.01"),
  acquisitionCurrency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter ISO currency code (e.g. USD)")
    .transform((v) => v.toUpperCase()),
  ownerEntity: z
    .string()
    .trim()
    .min(1, "Owner entity is required")
    .max(120, "Owner entity must be 120 characters or fewer"),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
