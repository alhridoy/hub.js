import { InitiativePermissionPolicies } from "../initiatives/_internal/InitiativeBusinessRules";
import { ProjectPermissionPolicies } from "../projects/_internal/ProjectBusinessRules";
import { SitesPermissionPolicies } from "../sites/_internal/SiteBusinessRules";
import { DiscussionPermissionPolicies } from "../discussions/_internal/DiscussionBusinessRules";
import { ContentPermissionPolicies } from "../content/_internal/ContentBusinessRules";

import { IPermissionPolicy, Permission } from "./types";
import { GroupPermissionPolicies } from "../groups/_internal/GroupBusinessRules";
import { PagePermissionPolicies } from "../pages/_internal/PageBusinessRules";
import { PlatformPermissionPolicies } from "./PlatformPermissionPolicies";
import { InitiativeTemplatePermissionPolicies } from "../initiative-templates/_internal/InitiativeTemplateBusinessRules";
import { TemplatePermissionPolicies } from "../templates/_internal/TemplateBusinessRules";

// Examples of possible Permission Policies
// const DiscussionPermissionPolicies: IPermissionPolicy[] = [
//   {
//     permission: "discussions:channel:create",
//     authenticated: true,
//     services: ["discussions"],
//     licenses: ["hub-basic", "hub-premium"],
//   },
//   {
//     permission: "discussions:channel:createprivate",
//     authenticated: true,
//     licenses: ["hub-basic", "hub-premium"],
//     assertions: [
//       {
//         property: "entity:group.typekeywords",
//         assertion: "without",
//         value: "cannotDiscuss",
//       },
//       {
//         property: "context:currentUser",
//         assertion: "is-group-admin",
//         value: "entity:group.id",
//       },
//     ],
//   },
//   {
//     permission: "discussions:channel:create",
//     services: ["discussions"],
//     authenticated: true,
//     licenses: ["hub-basic", "hub-premium"],
//     assertions: [
//       {
//         property: "entity:typeKeywords",
//         assertion: "without",
//         value: "cannotDiscuss",
//       },
//     ],
//   },
//   {
//     permission: "discussions:post:create",
//     services: ["discussions"],
//     authenticated: true,
//     licenses: ["hub-basic", "hub-premium"],
//     assertions: [
//       {
//         property: "entity:typeKeywords",
//         assertion: "without",
//         value: "cannotDiscuss",
//       },
//     ],
//   },
// ];

// DEPRECATED!
// NO LONGER USED IN OPENDATA-UI DO NOT ADD MORE TO THIS LIST
const TempPermissionPolicies: IPermissionPolicy[] = [
  {
    permission: "temp:workspace:released", // replace with hub:features:workspace
    availability: ["alpha"],
    environments: ["devext", "qaext"],
  },
];

/**
 * Highlevel Permission definitions for the Hub System as a whole
 * Typically other permissions depend on these so a whole set of features
 * can be enabled / disabled by changing a single permission
 */
const SystemPermissionPolicies: IPermissionPolicy[] = [
  {
    permission: "hub:feature:privacy",
    availability: ["alpha"],
    environments: ["qaext"],
  },
  {
    permission: "hub:feature:workspace",
    availability: ["alpha"],
    environments: ["devext", "qaext"],
  },
];

/**
 * All the permission policies for the Hub
 */
export const HubPermissionsPolicies: IPermissionPolicy[] = [
  ...SitesPermissionPolicies,
  ...ProjectPermissionPolicies,
  ...InitiativePermissionPolicies,
  ...DiscussionPermissionPolicies,
  ...ContentPermissionPolicies,
  ...GroupPermissionPolicies,
  ...PagePermissionPolicies,
  ...TemplatePermissionPolicies,
  ...PlatformPermissionPolicies,
  ...TempPermissionPolicies,
  ...InitiativeTemplatePermissionPolicies,
  ...SystemPermissionPolicies,
];

/**
 * Get the policies defined for a specific permission
 * @param permission
 * @returns
 */
export function getPermissionPolicy(permission: Permission): IPermissionPolicy {
  return HubPermissionsPolicies.find((p) => p.permission === permission);
}
