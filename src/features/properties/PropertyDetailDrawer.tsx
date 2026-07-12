import type { ReactNode } from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeDetailDrawer } from "../ui/uiSlice";
import { useGetPropertyEnrichedQuery } from "./propertiesApi";
import { RiskBadge } from "./RiskBadge";
import type { ValuationTrend } from "./types";

const TREND_ICON: Record<ValuationTrend, JSX.Element> = {
  UP: <TrendingUpIcon color="success" />,
  DOWN: <TrendingDownIcon color="error" />,
  STABLE: <TrendingFlatIcon color="disabled" />,
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

export function PropertyDetailDrawer() {
  const dispatch = useAppDispatch();
  const { open, propertyId } = useAppSelector((s) => s.ui.detailDrawer);

  // skip: undefined guards against calling the endpoint with a stale/null id.
  const { data, isFetching, isError } = useGetPropertyEnrichedQuery(
    propertyId ?? 0,
    { skip: propertyId === null || !open },
  );

  return (
    <Drawer anchor="right" open={open} onClose={() => dispatch(closeDetailDrawer())}>
      <Box sx={{ width: 380, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Property detail</Typography>
          <IconButton onClick={() => dispatch(closeDetailDrawer())}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ my: 2 }} />

        {isFetching && (
          <Stack spacing={1}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={28} />
            ))}
          </Stack>
        )}

        {isError && (
          <Alert severity="error">Failed to load enriched property data.</Alert>
        )}

        {data && !isFetching && (
          <Stack>
            <Typography variant="h6" gutterBottom>
              {data.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {data.city}, {data.countryCode}
            </Typography>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Portfolio data
            </Typography>
            <Row label="Property type" value={data.propertyType.replace("_", " ")} />
            <Row label="Status" value={data.status.replace("_", " ")} />
            <Row label="Size" value={`${data.sizeSqm.toLocaleString()} sqm`} />
            <Row
              label="Acquisition cost"
              value={`${data.acquisitionCost.toLocaleString()} ${data.acquisitionCurrency}`}
            />
            <Row label="Acquisition date" value={data.acquisitionDate} />

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Enriched valuation
            </Typography>
            <Row
              label="Estimated market value"
              value={`${data.estimatedMarketValue.toLocaleString()} ${data.marketValueCurrency}`}
            />
            <Row label="Confidence" value={data.valuationConfidence} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                Trend
              </Typography>
              {TREND_ICON[data.trend]}
            </Stack>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              AML risk
            </Typography>
            <Box sx={{ py: 0.5 }}>
              <RiskBadge rating={data.amlRiskRating} />
            </Box>
            {data.amlRiskScore !== undefined && (
              <Row label="Risk score" value={data.amlRiskScore} />
            )}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
