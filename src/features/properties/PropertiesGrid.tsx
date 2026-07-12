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
import type { EnrichedPropertyDto, PropertyQueryArgs } from "./types";

const currency = (value: number, code: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(
    value,
  );

export function PropertiesGrid() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.ui.filters);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "name", sort: "asc" },
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

  const columns: GridColDef<EnrichedPropertyDto>[] = [
    { field: "name", headerName: "Project name", flex: 1.4, minWidth: 180 },
    { field: "countryCode", headerName: "Country", width: 100 },
    { field: "city", headerName: "City", width: 140 },
    {
      field: "propertyType",
      headerName: "Property type",
      width: 140,
      valueFormatter: (value: string) => value.replace("_", " "),
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      valueFormatter: (value: string) => value.replace("_", " "),
    },
    {
      field: "sizeSqm",
      headerName: "Size (sqm)",
      width: 120,
      type: "number",
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: "acquisitionCost",
      headerName: "Acquisition cost",
      width: 160,
      type: "number",
      valueFormatter: (value: number, row) =>
        currency(value, row.acquisitionCurrency),
    },
    {
      field: "estimatedMarketValue",
      headerName: "Est. market value",
      width: 170,
      type: "number",
      sortable: false,
      valueFormatter: (value: number, row) =>
        currency(value, row.marketValueCurrency),
    },
    {
      field: "amlRiskRating",
      headerName: "AML risk",
      width: 150,
      sortable: false,
      renderCell: (params) => <RiskBadge rating={params.value} />,
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
              onClick={() => dispatch(openEditModal(params.row))}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => dispatch(openDeleteDialog(params.row))}
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
      onRowClick={(params) => dispatch(openDetailDrawer(params.row.id))}
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
