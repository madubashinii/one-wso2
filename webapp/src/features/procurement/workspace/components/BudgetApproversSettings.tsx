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

import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { describeError } from "@api/errors";
import { useNotifications } from "@context/notifications/NotificationsContext";
import {
  useAddBudgetApprover,
  useBudgetApproverSettings,
  useChangeBudgetApprover,
  useDirectorySearch,
  useProcurementLookups,
} from "../../api/useProcurement";
import { MIN_DIRECTORY_QUERY } from "../../request-form/requestFormModel";
import type { BudgetApproverScopes, BudgetApproverSetting, Choice, Person, ProcurementLookups } from "../../types";

const personLabel = (person: Person): string => `${person.name} (${person.email})`;

/** The list's options, plus any saved code the list no longer offers, which stays chosen and shows as its code. */
const withSaved = (list: Choice[], codes: string[]): Choice[] => [
  ...list,
  ...codes.filter((code) => !list.some((c) => c.value === code)).map((code) => ({ value: code, label: code })),
];

const labelOf = (list: Choice[], code: string): string => list.find((c) => c.value === code)?.label ?? code;

function ScopePicker({
  label,
  list,
  codes,
  disabled,
  onChange,
}: {
  label: string;
  list: Choice[];
  codes: string[];
  disabled: boolean;
  onChange: (codes: string[]) => void;
}) {
  const options = withSaved(list, codes);
  return (
    <Autocomplete
      multiple
      size="small"
      disableCloseOnSelect
      options={options}
      value={options.filter((o) => codes.includes(o.value))}
      disabled={disabled}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, next) => onChange(next.map((o) => o.value))}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

/** The pop-up for adding a budget approver, or changing one, which cannot be dismissed while a save runs. */
function ApproverForm({ approver, lookups, onClose }: { approver: BudgetApproverSetting | null; lookups: ProcurementLookups; onClose: () => void }) {
  const add = useAddBudgetApprover();
  const change = useChangeBudgetApprover();
  const { showSuccess } = useNotifications();
  const [chosen, setChosen] = useState<Person | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(approver?.isActive ?? true);
  const [scopes, setScopes] = useState<BudgetApproverScopes>({ businessUnits: approver?.businessUnits ?? [], regions: approver?.regions ?? [] });
  const search = useDirectorySearch(query, false);
  const saving = add.isPending || change.isPending;
  const failure = add.error ?? change.error;
  const options = [...(search.data ?? []), ...(chosen ? [chosen] : [])].filter(
    (person, index, all) => all.findIndex((other) => other.email.toLowerCase() === person.email.toLowerCase()) === index,
  );
  const hasScope = scopes.businessUnits.length + scopes.regions.length > 0;
  const done = (message: string) => ({
    onSuccess: () => {
      showSuccess(message);
      onClose();
    },
  });
  const save = () => {
    if (approver) change.mutate({ id: approver.id, change: { isActive, ...scopes } }, done(`${approver.name} was updated.`));
    else if (chosen) add.mutate({ email: chosen.email, scopes }, done(`${chosen.name} is now a budget approver.`));
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !saving && onClose()}>
      <DialogTitle>{approver ? `Change ${approver.name}` : "Add a budget approver"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!approver && (
            <Autocomplete
              size="small"
              open={open && query.trim().length >= MIN_DIRECTORY_QUERY}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              options={options}
              value={chosen}
              disabled={saving}
              loading={search.isFetching}
              getOptionLabel={personLabel}
              isOptionEqualToValue={(a, b) => a.email.toLowerCase() === b.email.toLowerCase()}
              filterOptions={(all) => all}
              noOptionsText="No matching employee"
              onChange={(_, next) => setChosen(next)}
              onInputChange={(_, next, reason) => setQuery(reason === "input" ? next : "")}
              renderInput={(params) => <TextField {...params} label="Employee" placeholder="Search by email" />}
            />
          )}
          {search.isError && <Alert severity="error">{describeError(search.error)}</Alert>}
          <ScopePicker
            label="Business units"
            list={lookups.businessUnits}
            codes={scopes.businessUnits}
            disabled={saving}
            onChange={(businessUnits) => setScopes((s) => ({ ...s, businessUnits }))}
          />
          <ScopePicker label="Regions" list={lookups.regions} codes={scopes.regions} disabled={saving} onChange={(regions) => setScopes((s) => ({ ...s, regions }))} />
          <Typography variant="caption" color="text.secondary">
            A requester is offered this person when their business unit or region is one of these. Choose at least one.
          </Typography>
          {approver && (
            <FormControlLabel
              control={<Switch checked={isActive} disabled={saving} onChange={(_, checked) => setIsActive(checked)} />}
              label="Offered to requesters"
            />
          )}
          {failure && <Alert severity="error">{describeError(failure)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" disabled={saving || !hasScope || (!approver && !chosen)} onClick={save}>
          {saving ? "Saving…" : approver ? "Save changes" : "Add approver"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Who can be chosen as a budget approver on a request, and for which business units and regions. */
export default function BudgetApproversSettings() {
  const approvers = useBudgetApproverSettings();
  const lookups = useProcurementLookups();
  const [editing, setEditing] = useState<BudgetApproverSetting | "new" | null>(null);

  if (approvers.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void approvers.refetch()}>
            Retry
          </Button>
        }
      >
        {describeError(approvers.error)}
      </Alert>
    );
  }
  if (!approvers.data) return <Skeleton variant="rounded" height={240} />;

  const names = lookups.data ?? { budgetCategories: [], businessUnits: [], products: [], regions: [] };
  return (
    <>
      {lookups.isError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void lookups.refetch()}>
              Retry
            </Button>
          }
        >
          The business units and regions could not be loaded, so they show as codes. {describeError(lookups.error)}
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" disabled={!lookups.data} onClick={() => setEditing("new")}>
          Add budget approver
        </Button>
      </Stack>
      {approvers.data.length === 0 ? (
        <Alert severity="info">There are no budget approvers yet.</Alert>
      ) : (
        <TableContainer>
          <Table size="small" aria-label="Budget approvers">
            <TableHead>
              <TableRow>
                <TableCell>Approver</TableCell>
                <TableCell>Covers</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {approvers.data.map((approver) => (
                <TableRow key={approver.id}>
                  <TableCell>
                    {approver.name}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {approver.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {approver.businessUnits.map((code) => (
                        <Chip key={`bu-${code}`} size="small" variant="outlined" label={labelOf(names.businessUnits, code)} />
                      ))}
                      {approver.regions.map((code) => (
                        <Chip key={`reg-${code}`} size="small" variant="outlined" label={labelOf(names.regions, code)} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={approver.isActive ? "success" : "default"} label={approver.isActive ? "Offered" : "Not offered"} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" aria-label={`Change ${approver.name}`} onClick={() => setEditing(approver)}>
                      Change
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {editing && lookups.data && (
        <ApproverForm approver={editing === "new" ? null : editing} lookups={lookups.data} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
