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
import FilterChips from "../../components/FilterChips";
import BudgetApproversSettings from "../components/BudgetApproversSettings";
import ReferenceOptionsSettings from "../components/ReferenceOptionsSettings";

type Section = "approvers" | "options";
const SECTIONS: { value: Section; label: string }[] = [
  { value: "approvers", label: "Budget approvers" },
  { value: "options", label: "Form options" },
];

/** What a Procurement admin keeps for the request form: who the budget approvers are, and the options of its lists. */
export default function SettingsPage() {
  const [section, setSection] = useState<Section>("approvers");
  return (
    <>
      <FilterChips label="Settings" options={SECTIONS} value={section} onChange={setSection} />
      {section === "approvers" ? <BudgetApproversSettings /> : <ReferenceOptionsSettings />}
    </>
  );
}
