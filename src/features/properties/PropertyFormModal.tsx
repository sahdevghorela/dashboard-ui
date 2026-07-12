import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useSnackbar } from "notistack";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeFormModal } from "../ui/uiSlice";
import { propertySchema, type PropertyFormValues } from "./propertySchema";
import { PROJECT_STATUSES, PROPERTY_TYPES } from "./types";
import {
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
} from "./propertiesApi";

const EMPTY_VALUES: PropertyFormValues = {
  projectName: "",
  countryCode: "",
  city: "",
  address: "",
  propertyType: "OFFICE",
  status: "ACTIVE",
  sizeSqm: 0,
  acquisitionDate: new Date().toISOString().slice(0, 10),
  acquisitionCost: 0,
  acquisitionCurrency: "USD",
  ownerEntity: "",
};

export function PropertyFormModal() {
  const dispatch = useAppDispatch();
  const { open, mode, property } = useAppSelector((s) => s.ui.formModal);
  const { enqueueSnackbar } = useSnackbar();

  const [createProperty, { isLoading: isCreating }] =
    useCreatePropertyMutation();
  const [updateProperty, { isLoading: isUpdating }] =
    useUpdatePropertyMutation();
  const isSaving = isCreating || isUpdating;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && property) {
      reset({
        projectName: property.projectName,
        countryCode: property.countryCode,
        city: property.city,
        address: property.address,
        propertyType: property.propertyType,
        status: property.status,
        sizeSqm: property.sizeSqm,
        acquisitionDate: property.acquisitionDate.slice(0, 10),
        acquisitionCost: property.acquisitionCost,
        acquisitionCurrency: property.acquisitionCurrency,
        ownerEntity: property.ownerEntity,
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, mode, property, reset]);

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      if (mode === "edit" && property) {
        await updateProperty({ id: property.id, body: values }).unwrap();
        enqueueSnackbar("Property updated", { variant: "success" });
      } else {
        await createProperty(values).unwrap();
        enqueueSnackbar("Property created", { variant: "success" });
      }
      dispatch(closeFormModal());
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Save failed. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => dispatch(closeFormModal())}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {mode === "edit" ? "Edit property" : "Add property"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Controller
                name="projectName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project name"
                    fullWidth
                    error={!!errors.projectName}
                    helperText={errors.projectName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address"
                    fullWidth
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="countryCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country code"
                    placeholder="US"
                    fullWidth
                    error={!!errors.countryCode}
                    helperText={errors.countryCode?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City"
                    fullWidth
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Property type"
                    fullWidth
                    error={!!errors.propertyType}
                    helperText={errors.propertyType?.message}
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.replace("_", " ")}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="sizeSqm"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Size (sqm)"
                    fullWidth
                    error={!!errors.sizeSqm}
                    helperText={errors.sizeSqm?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="acquisitionDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Acquisition date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.acquisitionDate}
                    helperText={errors.acquisitionDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="acquisitionCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Acquisition cost"
                    fullWidth
                    error={!!errors.acquisitionCost}
                    helperText={errors.acquisitionCost?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="acquisitionCurrency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Currency"
                    placeholder="USD"
                    fullWidth
                    error={!!errors.acquisitionCurrency}
                    helperText={errors.acquisitionCurrency?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="ownerEntity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Owner entity"
                    fullWidth
                    error={!!errors.ownerEntity}
                    helperText={errors.ownerEntity?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(closeFormModal())}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {mode === "edit" ? "Save changes" : "Create property"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
