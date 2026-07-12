import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  PropertyDto,
  PropertyStatus,
  PropertyType,
} from "../properties/types";

export interface PropertyFilters {
  status: PropertyStatus | "ALL";
  propertyType: PropertyType | "ALL";
  countryCode: string; // "" means no filter
}

export interface UiState {
  formModal: {
    open: boolean;
    mode: "create" | "edit";
    property: PropertyDto | null;
  };
  deleteDialog: {
    open: boolean;
    property: PropertyDto | null;
  };
  detailDrawer: {
    open: boolean;
    propertyId: number | null;
  };
  filters: PropertyFilters;
}

const initialState: UiState = {
  formModal: { open: false, mode: "create", property: null },
  deleteDialog: { open: false, property: null },
  detailDrawer: { open: false, propertyId: null },
  filters: { status: "ALL", propertyType: "ALL", countryCode: "" },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openCreateModal(state) {
      state.formModal = { open: true, mode: "create", property: null };
    },
    openEditModal(state, action: PayloadAction<PropertyDto>) {
      state.formModal = { open: true, mode: "edit", property: action.payload };
    },
    closeFormModal(state) {
      state.formModal.open = false;
    },
    openDeleteDialog(state, action: PayloadAction<PropertyDto>) {
      state.deleteDialog = { open: true, property: action.payload };
    },
    closeDeleteDialog(state) {
      state.deleteDialog.open = false;
    },
    openDetailDrawer(state, action: PayloadAction<number>) {
      state.detailDrawer = { open: true, propertyId: action.payload };
    },
    closeDetailDrawer(state) {
      state.detailDrawer.open = false;
    },
    setStatusFilter(state, action: PayloadAction<PropertyFilters["status"]>) {
      state.filters.status = action.payload;
    },
    setPropertyTypeFilter(
      state,
      action: PayloadAction<PropertyFilters["propertyType"]>,
    ) {
      state.filters.propertyType = action.payload;
    },
    setCountryFilter(state, action: PayloadAction<string>) {
      state.filters.countryCode = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
  },
});

export const {
  openCreateModal,
  openEditModal,
  closeFormModal,
  openDeleteDialog,
  closeDeleteDialog,
  openDetailDrawer,
  closeDetailDrawer,
  setStatusFilter,
  setPropertyTypeFilter,
  setCountryFilter,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
