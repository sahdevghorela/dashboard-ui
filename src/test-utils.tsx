import type { ReactElement } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { baseApi } from "./api/baseApi";
import uiReducer from "./features/ui/uiSlice";
import type { RootState } from "./app/store";

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      ui: uiReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState,
  });
}

const theme = createTheme();

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState }: { preloadedState?: Partial<RootState> } = {},
) {
  const store = createTestStore(preloadedState);
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider>{ui}</SnackbarProvider>
        </ThemeProvider>
      </Provider>,
    ),
  };
}
