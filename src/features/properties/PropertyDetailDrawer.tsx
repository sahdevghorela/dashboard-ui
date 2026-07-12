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
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeDetailDrawer } from "../ui/uiSlice";
import { useGetPropertyEnrichedQuery } from "./propertiesApi";
import { RiskBadge } from "./RiskBadge";
import type { MarketTrend } from "./types";

const TREND_ICON: Record<MarketTrend, JSX.Element> = {
  RISING: <TrendingUpIcon color="success" />,
  DECLINING: <TrendingDownIcon color="error" />,
  STABLE: <TrendingFlatIcon color="disabled" />,
};

const currency = (value: number | null, code: string) =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(
        value,
      );

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
      <Box sx={{ width: 400, p: 3 }}>
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
              {data.property.projectName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {data.property.address}, {data.property.city}, {data.property.countryCode}
            </Typography>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Portfolio data
            </Typography>
            <Row label="Owner entity" value={data.property.ownerEntity} />
            <Row label="Property type" value={data.property.propertyType.replace(/_/g, " ")} />
            <Row label="Status" value={data.property.status.replace(/_/g, " ")} />
            <Row label="Size" value={`${data.property.sizeSqm.toLocaleString()} sqm`} />
            <Row
              label="Acquisition cost"
              value={currency(data.property.acquisitionCost, data.property.acquisitionCurrency)}
            />
            <Row label="Acquisition date" value={data.property.acquisitionDate} />

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Enriched valuation (valuation-service)
            </Typography>
            {data.valuationUnavailable ? (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Valuation temporarily unavailable — showing last known
                portfolio data only.
              </Alert>
            ) : (
              <>
                <Row
                  label="Estimated market value"
                  value={currency(data.estimatedMarketValue, data.property.acquisitionCurrency)}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">
                    Trend
                  </Typography>
                  {TREND_ICON[data.marketTrend as MarketTrend] ?? (
                    <HelpOutlineIcon color="disabled" />
                  )}
                </Stack>
              </>
            )}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              FX conversion (fx-compliance-service)
            </Typography>
            <Row
              label="Acquisition cost (USD)"
              value={data.fxUnavailable ? "Unavailable" : currency(data.valueUSD, "USD")}
            />

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              AML risk (fx-compliance-service)
            </Typography>
            <Box sx={{ py: 0.5 }}>
              <RiskBadge
                rating={data.amlRiskRating}
                unavailable={data.complianceUnavailable}
              />
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
