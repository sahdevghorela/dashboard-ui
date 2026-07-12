import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import { PropertyFormModal } from "../PropertyFormModal";

function openCreateModalState() {
  return {
    ui: {
      formModal: {
        open: true as const,
        mode: "create" as const,
        property: null,
      },
      deleteDialog: { open: false, property: null },
      detailDrawer: { open: false, propertyId: null },
      filters: { status: "ALL" as const, propertyType: "ALL" as const, countryCode: "" },
    },
  };
}

describe("PropertyFormModal", () => {
  it("shows required-field validation errors and does not submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyFormModal />, {
      preloadedState: openCreateModalState(),
    });

    await user.click(screen.getByRole("button", { name: /create property/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/2-letter iso country code/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/city is required/i)).toBeInTheDocument();

    // The dialog is still open (mode/title unchanged) because validation
    // blocked the mutation from ever firing.
    expect(
      screen.getByRole("heading", { name: /add property/i }),
    ).toBeInTheDocument();
  });

  it("clears a field's error once it is filled in", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyFormModal />, {
      preloadedState: openCreateModalState(),
    });

    await user.click(screen.getByRole("button", { name: /create property/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/project name/i), "Riverside Tower");
    await user.click(screen.getByRole("button", { name: /create property/i }));

    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});
