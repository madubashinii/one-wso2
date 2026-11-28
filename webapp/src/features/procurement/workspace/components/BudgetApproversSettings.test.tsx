// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BudgetApproversSettings from "./BudgetApproversSettings";

const state = vi.hoisted(() => ({
  approvers: {} as Record<string, unknown>,
  add: { mutate: vi.fn(), isPending: false, error: null as unknown },
  change: { mutate: vi.fn(), isPending: false, error: null as unknown },
}));
const showSuccess = vi.hoisted(() => vi.fn());
vi.mock("@context/notifications/NotificationsContext", () => ({ useNotifications: () => ({ showSuccess }) }));
vi.mock("../../api/useProcurement", () => ({
  useBudgetApproverSettings: () => state.approvers,
  useAddBudgetApprover: () => state.add,
  useChangeBudgetApprover: () => state.change,
  useProcurementLookups: () => ({
    data: {
      budgetCategories: [],
      businessUnits: [{ value: "BU-1", label: "Sales" }, { value: "BU-2", label: "Engineering" }],
      products: [],
      regions: [{ value: "REG-1", label: "Global" }],
    },
    isError: false,
    refetch: vi.fn(),
  }),
  useDirectorySearch: (query: string) => ({
    data: query.trim().length >= 3 ? [{ id: "drew.parker@example.com", name: "Drew Parker", email: "drew.parker@example.com" }] : [],
    isFetching: false,
    isError: false,
  }),
}));

const approver = (patch = {}) => ({ id: "10", name: "Budget Owner", email: "budget.owner@example.com", isActive: true, businessUnits: ["BU-1"], regions: ["REG-1"], ...patch });
const loaded = (data: unknown[]) => ({ data, isError: false, refetch: vi.fn() });

beforeEach(() => {
  state.approvers = loaded([approver(), approver({ id: "11", name: "Regional Owner", email: "regional.owner@example.com", isActive: false, businessUnits: ["BU-X"], regions: [] })]);
  state.add.mutate.mockReset().mockImplementation((_v: unknown, o?: { onSuccess?: () => void }) => o?.onSuccess?.());
  state.change.mutate.mockReset().mockImplementation((_v: unknown, o?: { onSuccess?: () => void }) => o?.onSuccess?.());
  state.add.isPending = false;
  state.add.error = null;
  state.change.error = null;
  showSuccess.mockReset();
});

describe("BudgetApproversSettings", () => {
  it("lists each approver with what they cover by name, a saved code the lists no longer offer by its code, and whether they are offered", () => {
    render(<BudgetApproversSettings />);
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Sales")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Global")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Offered")).toBeInTheDocument();
    expect(within(rows[2]).getByText("BU-X")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Not offered")).toBeInTheDocument();
  });

  it("adds an employee as an approver only once an employee and at least one business unit or region are chosen", async () => {
    const user = userEvent.setup();
    render(<BudgetApproversSettings />);
    await user.click(screen.getByRole("button", { name: "Add budget approver" }));
    const dialog = screen.getByRole("dialog", { name: "Add a budget approver" });
    const save = within(dialog).getByRole("button", { name: "Add approver" });
    expect(save).toBeDisabled();
    await user.type(within(dialog).getByRole("combobox", { name: "Employee" }), "dre");
    await user.click(await screen.findByRole("option", { name: "Drew Parker (drew.parker@example.com)" }));
    expect(save).toBeDisabled();
    await user.click(within(dialog).getByRole("combobox", { name: "Business units" }));
    await user.click(await screen.findByRole("option", { name: "Sales" }));
    await user.click(save);
    expect(state.add.mutate).toHaveBeenCalledWith({ email: "drew.parker@example.com", scopes: { businessUnits: ["BU-1"], regions: [] } }, expect.anything());
    expect(showSuccess).toHaveBeenCalledWith("Drew Parker is now a budget approver.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("changes whether an approver is offered, keeping what they cover", async () => {
    const user = userEvent.setup();
    render(<BudgetApproversSettings />);
    await user.click(screen.getByRole("button", { name: "Change Budget Owner" }));
    const dialog = screen.getByRole("dialog", { name: "Change Budget Owner" });
    await user.click(within(dialog).getByRole("switch", { name: "Offered to requesters" }));
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(state.change.mutate).toHaveBeenCalledWith({ id: "10", change: { isActive: false, businessUnits: ["BU-1"], regions: ["REG-1"] } }, expect.anything());
  });

  it("will not save an approver who covers nothing, and shows what the backend refused", async () => {
    const user = userEvent.setup();
    state.change.error = new Error("A business unit or region cannot be used.");
    render(<BudgetApproversSettings />);
    await user.click(screen.getByRole("button", { name: "Change Regional Owner" }));
    const dialog = screen.getByRole("dialog", { name: "Change Regional Owner" });
    expect(within(dialog).getByText("A business unit or region cannot be used.")).toBeInTheDocument();
    await user.click(within(dialog).getByTestId("CancelIcon"));
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("says so when the approvers could not be read, and offers a Retry", async () => {
    const refetch = vi.fn();
    state.approvers = { data: undefined, isError: true, error: new Error("Forbidden."), refetch };
    const user = userEvent.setup();
    render(<BudgetApproversSettings />);
    expect(screen.getByText("Forbidden.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
