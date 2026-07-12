import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  openCreateModal,
  resetFilters,
  setCountryFilter,
  setPropertyTypeFilter,
  setStatusFilter,
} from "../ui/uiSlice";
import { PROJECT_STATUSES, PROPERTY_TYPES } from "./types";

export function PropertiesFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.ui.filters);

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      flexWrap="wrap"
      sx={{ mb: 2 }}
    >
      <TextField
        select
        size="small"
        label="Status"
        value={filters.status}
        onChange={(e) => dispatch(setStatusFilter(e.target.value as never))}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="ALL">All statuses</MenuItem>
        {PROJECT_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {s.replace("_", " ")}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Property type"
        value={filters.propertyType}
        onChange={(e) =>
          dispatch(setPropertyTypeFilter(e.target.value as never))
        }
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="ALL">All types</MenuItem>
        {PROPERTY_TYPES.map((t) => (
          <MenuItem key={t} value={t}>
            {t.replace("_", " ")}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        label="Country code"
        placeholder="US"
        value={filters.countryCode}
        onChange={(e) => dispatch(setCountryFilter(e.target.value))}
        sx={{ width: 140 }}
      />

      <Button size="small" onClick={() => dispatch(resetFilters())}>
        Clear filters
      </Button>

      <Stack sx={{ flexGrow: 1 }} />

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => dispatch(openCreateModal())}
      >
        Add property
      </Button>
    </Stack>
  );
}
