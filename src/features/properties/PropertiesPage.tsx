import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PropertiesFilters } from "./PropertiesFilters";
import { PropertiesGrid } from "./PropertiesGrid";
import { PropertyFormModal } from "./PropertyFormModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { PropertyDetailDrawer } from "./PropertyDetailDrawer";

export function PropertiesPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Real Estate Portfolio
      </Typography>
      <Paper sx={{ p: 2 }}>
        <PropertiesFilters />
        <PropertiesGrid />
      </Paper>

      <PropertyFormModal />
      <DeleteConfirmDialog />
      <PropertyDetailDrawer />
    </Container>
  );
}
