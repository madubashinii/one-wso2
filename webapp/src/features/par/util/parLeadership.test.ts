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

import { describe, expect, it } from "vitest";
import { isLeadershipEmployee } from "./parLeadership";

describe("isLeadershipEmployee", () => {
  it("is true for the exact LEADERSHIP GROUP sub-team", () => {
    expect(isLeadershipEmployee("LEADERSHIP GROUP")).toBe(true);
  });

  it("is false for any other sub-team", () => {
    expect(isLeadershipEmployee("API MANAGEMENT")).toBe(false);
  });

  it("is false when subTeam is undefined", () => {
    expect(isLeadershipEmployee(undefined)).toBe(false);
  });

  it("is case-sensitive, matching the backend's exact-string check", () => {
    expect(isLeadershipEmployee("Leadership Group")).toBe(false);
  });
});
