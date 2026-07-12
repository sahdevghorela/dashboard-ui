import Chip from "@mui/material/Chip";
import type { RiskRating } from "./types";

const RISK_COLOR: Record<RiskRating, "success" | "warning" | "error"> = {
  GREEN: "success",
  AMBER: "warning",
  RED: "error",
};

const RISK_LABEL: Record<RiskRating, string> = {
  GREEN: "Low",
  AMBER: "Medium",
  RED: "High",
};

export function RiskBadge({ rating }: { rating: RiskRating }) {
  return (
    <Chip
      size="small"
      color={RISK_COLOR[rating]}
      label={`${RISK_LABEL[rating]} (${rating})`}
      sx={{ fontWeight: 600 }}
    />
  );
}
