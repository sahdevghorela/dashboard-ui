import { z } from "zod";
import { PROPERTY_STATUSES, PROPERTY_TYPES } from "./types";

/**
 * Mirrors the bean validation annotations assumed on portfolio-service's
 * PropertyUpsertDto:
 *
 *   @NotBlank @Size(max = 200)      private String name;
 *   @NotBlank @Size(min = 2, max = 2) private String countryCode;   // ISO 3166-1 alpha-2
 *   @NotBlank @Size(max = 100)      private String city;
 *   @NotNull                        private PropertyType propertyType;
 *   @NotNull                        private PropertyStatus status;
 *   @NotNull @Positive              private BigDecimal sizeSqm;
 *   @NotNull @PositiveOrZero        private BigDecimal acquisitionCost;
 *   @NotBlank @Size(min = 3, max = 3) private String acquisitionCurrency; // ISO 4217
 *   @NotNull @PastOrPresent          private LocalDate acquisitionDate;
 *
 * Keeping these two schemas in lockstep means a 400 from the server should
 * only ever happen on a rule this file forgot to encode, not on a rule the
 * two sides disagree about.
 */
export const propertySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
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
  propertyType: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: "Select a property type" }),
  }),
  status: z.enum(PROPERTY_STATUSES, {
    errorMap: () => ({ message: "Select a status" }),
  }),
  sizeSqm: z.coerce
    .number({ invalid_type_error: "Size is required" })
    .positive("Size must be greater than 0"),
  acquisitionCost: z.coerce
    .number({ invalid_type_error: "Acquisition cost is required" })
    .nonnegative("Acquisition cost cannot be negative"),
  acquisitionCurrency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter ISO currency code (e.g. USD)")
    .transform((v) => v.toUpperCase()),
  acquisitionDate: z
    .string()
    .min(1, "Acquisition date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => new Date(v) <= new Date(), "Date cannot be in the future"),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
