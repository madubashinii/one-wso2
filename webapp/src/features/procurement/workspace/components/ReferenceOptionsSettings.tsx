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
} from "@wso2/oxygen-ui";
import { describeError } from "@api/errors";
import { useNotifications } from "@context/notifications/NotificationsContext";
import { useAddReferenceOption, useChangeReferenceOption, useReferenceSettings } from "../../api/useProcurement";
import FilterChips from "../../components/FilterChips";
import type { ReferenceKind, ReferenceSetting } from "../../types";

const LISTS: { value: ReferenceKind; label: string }[] = [
  { value: "BUDGET_CATEGORY", label: "Budget categories" },
  { value: "BUSINESS_UNIT", label: "Business units" },
  { value: "PRODUCT", label: "Products" },
  { value: "REGION", label: "Regions" },
];

const MAX_CODE_LENGTH = 50;
const MAX_LABEL_LENGTH = 150;

/** The pop-up for adding an option or changing one, which cannot be dismissed while a save runs. The code is set when the option is added. */
function OptionForm({ kind, option, onClose }: { kind: ReferenceKind; option: ReferenceSetting | null; onClose: () => void }) {
  const add = useAddReferenceOption();
  const change = useChangeReferenceOption();
  const { showSuccess } = useNotifications();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState(option?.label ?? "");
  const [isActive, setIsActive] = useState(option?.isActive ?? true);
  const saving = add.isPending || change.isPending;
  const failure = add.error ?? change.error;
  const valid = label.trim() !== "" && (option !== null || code.trim() !== "");
  const done = (message: string) => ({
    onSuccess: () => {
      showSuccess(message);
      onClose();
    },
  });
  const save = () => {
    if (option) change.mutate({ id: option.id, change: { label: label.trim(), isActive } }, done(`${label.trim()} was updated.`));
    else add.mutate({ kind, code: code.trim(), label: label.trim() }, done(`${label.trim()} was added.`));
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={() => !saving && onClose()}>
      <DialogTitle>{option ? `Change ${option.label}` : "Add an option"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {option ? (
            <TextField size="small" label="Code" value={option.code} disabled helperText="The code cannot be changed." />
          ) : (
            <TextField
              size="small"
              label="Code"
              value={code}
              disabled={saving}
              onChange={(e) => setCode(e.target.value)}
              slotProps={{ htmlInput: { maxLength: MAX_CODE_LENGTH } }}
              helperText="What the option is stored as. It cannot be changed later."
            />
          )}
          <TextField
            size="small"
            label="Label"
            value={label}
            disabled={saving}
            onChange={(e) => setLabel(e.target.value)}
            slotProps={{ htmlInput: { maxLength: MAX_LABEL_LENGTH } }}
            helperText="What requesters see."
          />
          {option && (
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
        <Button variant="contained" disabled={saving || !valid} onClick={save}>
          {saving ? "Saving…" : option ? "Save changes" : "Add option"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** The options of the request form's lists, which can be added to and taken off the form without losing the requests that use them. */
export default function ReferenceOptionsSettings() {
  const settings = useReferenceSettings();
  const [kind, setKind] = useState<ReferenceKind>("BUDGET_CATEGORY");
  const [editing, setEditing] = useState<ReferenceSetting | "new" | null>(null);

  if (settings.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void settings.refetch()}>
            Retry
          </Button>
        }
      >
        {describeError(settings.error)}
      </Alert>
    );
  }
  if (!settings.data) return <Skeleton variant="rounded" height={240} />;

  const rows = settings.data.filter((o) => o.kind === kind);
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <FilterChips label="List" options={LISTS} value={kind} onChange={setKind} />
        <Button variant="contained" sx={{ flexShrink: 0 }} onClick={() => setEditing("new")}>
          Add option
        </Button>
      </Stack>
      {rows.length === 0 ? (
        <Alert severity="info">This list has no options yet.</Alert>
      ) : (
        <TableContainer>
          <Table size="small" aria-label="Options">
            <TableHead>
              <TableRow>
                <TableCell>Label</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>{option.label}</TableCell>
                  <TableCell>{option.code}</TableCell>
                  <TableCell>
                    <Chip size="small" color={option.isActive ? "success" : "default"} label={option.isActive ? "Offered" : "Not offered"} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" aria-label={`Change ${option.label}`} onClick={() => setEditing(option)}>
                      Change
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {editing && <OptionForm kind={kind} option={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
