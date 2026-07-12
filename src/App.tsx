import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { PropertiesPage } from "./features/properties/PropertiesPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <PropertiesPage />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
