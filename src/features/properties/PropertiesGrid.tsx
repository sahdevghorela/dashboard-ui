import { useMemo, useState } from "react";
import { DataGrid, type GridColDef, type GridSortModel } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useGetEnrichedPropertiesQuery } from "./propertiesApi";
import { openDeleteDialog, openDetailDrawer, openEditModal } from "../ui/uiSlice";
import { RiskBadge } from "./RiskBadge";
import type { EnrichedRealEstateProjectResponse, PropertyQueryArgs } from "./types";

const currency = (value: number | null, code: string) =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
      }).format(value);

export function PropertiesGrid() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.ui.filters);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "projectName", sort: "asc" },
  ]);

  const queryArgs: PropertyQueryArgs = useMemo(
    () => ({
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortField: sortModel[0]?.field,
      sortDirection: sortModel[0]?.sort ?? undefined,
      status: filters.status === "ALL" ? undefined : filters.status,
      propertyType:
        filters.propertyType === "ALL" ? undefined : filters.propertyType,
      countryCode: filters.countryCode || undefined,
    }),
    [paginationModel, sortModel, filters],
  );

  const { data, isFetching, isError, error } =
    useGetEnrichedPropertiesQuery(queryArgs);

  const columns: GridColDef<EnrichedRealEstateProjectResponse>[] = [
    {
      field: "projectName",
      headerName: "Project name",
      flex: 1.4,
      minWidth: 180,
      valueGetter: (_value, row) => row.property.projectName,
    },
    {
      field: "countryCode",
      headerName: "Country",
      width: 100,
      valueGetter: (_value, row) => row.property.countryCode,
    },
    {
      field: "city",
      headerName: "City",
      width: 140,
      valueGetter: (_value, row) => row.property.city,
    },
    {
      field: "propertyType",
      headerName: "Property type",
      width: 140,
      valueGetter: (_value, row) => row.property.propertyType,
    },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      valueGetter: (_value, row) => row.property.status.replace(/_/g, " "),
    },
    {
      field: "sizeSqm",
      headerName: "Size (sqm)",
      width: 120,
      type: "number",
      valueGetter: (_value, row) => row.property.sizeSqm,
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: "acquisitionCost",
      headerName: "Acquisition cost",
      width: 170,
      type: "number",
      valueGetter: (_value, row) => row.property.acquisitionCost,
      renderCell: (params) =>
        currency(params.row.property.acquisitionCost, params.row.property.acquisitionCurrency),
    },
    {
      field: "estimatedMarketValue",
      headerName: "Est. market value",
      width: 170,
      type: "number",
      sortable: false,
      valueGetter: (_value, row) => row.estimatedMarketValue,
      renderCell: (params) =>
        params.row.valuationUnavailable
          ? "Unavailable"
          : currency(params.row.estimatedMarketValue, params.row.property.acquisitionCurrency),
    },
    {
      field: "amlRiskRating",
      headerName: "AML risk",
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <RiskBadge
          rating={params.row.amlRiskRating}
          unavailable={params.row.complianceUnavailable}
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack direction="row" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => dispatch(openEditModal(params.row.property))}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => dispatch(openDeleteDialog(params.row.property))}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  if (isError) {
    const message =
      (error as { data?: { message?: string } } | undefined)?.data?.message ??
      "Failed to load properties. Confirm portfolio-service is running at the configured API base URL.";
    return <Alert severity="error">{message}</Alert>;
  }

  return (
    <DataGrid
      autoHeight
      rows={data?.content ?? []}
      getRowId={(row) => row.property.id}
      rowCount={data?.totalElements ?? 0}
      columns={columns}
      loading={isFetching}
      // Server-side everything: the grid never paginates/sorts data it
      // already has in memory, it always asks propertiesApi for the exact
      // page/sort/filter combination via queryArgs above.
      paginationMode="server"
      sortingMode="server"
      filterMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      onRowClick={(params) => dispatch(openDetailDrawer(params.row.property.id))}
      // Column-level filter panels are disabled (see column defs) because
      // status/propertyType/country are already served by the dedicated
      // PropertiesFilters toolbar, which maps cleanly onto the backend's
      // ?status=&propertyType=&countryCode= query params. Free-text
      // per-column filtering would need a separate "contains" contract
      // the backend doesn't expose, so it's left off rather than faked
      // client-side against a single fetched page.
      sx={{
        "& .MuiDataGrid-row": { cursor: "pointer" },
      }}
    />
  );
}
