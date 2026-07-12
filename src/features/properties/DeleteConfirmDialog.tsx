import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeDeleteDialog } from "../ui/uiSlice";
import { useDeletePropertyMutation } from "./propertiesApi";

export function DeleteConfirmDialog() {
  const dispatch = useAppDispatch();
  const { open, property } = useAppSelector((s) => s.ui.deleteDialog);
  const { enqueueSnackbar } = useSnackbar();
  const [deleteProperty, { isLoading }] = useDeletePropertyMutation();

  const handleConfirm = async () => {
    if (!property) return;
    try {
      await deleteProperty(property.id).unwrap();
      enqueueSnackbar(`"${property.projectName}" deleted`, { variant: "success" });
      dispatch(closeDeleteDialog());
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Delete failed. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  return (
    <Dialog open={open} onClose={() => dispatch(closeDeleteDialog())}>
      <DialogTitle>Delete property</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete{" "}
          <strong>{property?.projectName}</strong>? This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(closeDeleteDialog())}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
