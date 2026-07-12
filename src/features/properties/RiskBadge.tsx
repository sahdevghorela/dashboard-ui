import Chip from "@mui/material/Chip";
import type { AmlRiskRating } from "./types";

const RISK_COLOR: Record<AmlRiskRating, "success" | "warning" | "error"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "error",
};

/**
 * `rating`/`unavailable` come straight from EnrichedRealEstateProjectResponse:
 * amlRiskRating is only ever "LOW" | "MEDIUM" | "HIGH" when
 * complianceUnavailable is false — when the downstream fx-compliance-service
 * call fails, the backend fills it with the sentinel string
 * "compliance unavailable" instead, so branch on the boolean flag rather than
 * string-matching that text.
 */
export function RiskBadge({
  rating,
  unavailable,
}: {
  rating: string;
  unavailable: boolean;
}) {
  if (unavailable || !(rating in RISK_COLOR)) {
    return <Chip size="small" color="default" label="Unavailable" />;
  }
  const known = rating as AmlRiskRating;
  return (
    <Chip
      size="small"
      color={RISK_COLOR[known]}
      label={`${known} risk`}
      sx={{ fontWeight: 600 }}
    />
  );
}
