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

/** par-app's own fixed constant (modules/types/constants.bal's
 * LEADERSHIP_GROUP) for the subTeam value that marks an employee as part of
 * the leadership group. Not admin-configurable like top5p20pEnabledRating,
 * so it lives here rather than in apiConfig.ts. */
const LEADERSHIP_GROUP = "LEADERSHIP GROUP";

/** Mirrors par-app's own `parSubTeam === LEADERSHIP_GROUP` check
 * (manager.bal's updateParRating) that gates both the Top 5%/20% special
 * rating and the PAR rating options below. */
export function isLeadershipEmployee(parSubTeam: string | undefined): boolean {
  return parSubTeam === LEADERSHIP_GROUP;
}

/** par-app's own restriction (manager.bal's updateParRating): a leadership
 * employee's PAR rating may only be "Successful" or "Step Up" — never NI or
 * anything else in the cycle's configured parRatings list. */
export const LEADERSHIP_ALLOWED_RATINGS = ["Successful", "Step Up"];
