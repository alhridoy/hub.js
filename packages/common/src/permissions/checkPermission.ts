import { IArcGISContext } from "../ArcGISContext";
import { getWithDefault } from "../objects";
import { checkLicense } from "./_internal/checkLicense";
import { getPermissionPolicy } from "./HubPermissionPolicies";
import {
  IPermissionAccessResponse,
  Permission,
  isPermission,
  IPolicyCheck,
  IEntityPermissionPolicy,
} from "./types";
import { getPolicyResponseCode } from "./_internal/getPolicyResponseCode";
import { checkAuthentication } from "./_internal/checkAuthentication";
import { checkAlphaGating } from "./_internal/checkAlphaGating";
import { checkOwner } from "./_internal/checkOwner";
import { checkEdit } from "./_internal/checkEdit";
import { checkPrivileges } from "./_internal/checkPrivileges";
import { checkEntityPolicy } from "./_internal/checkEntityPolicy";
import { checkAssertions } from "./_internal/checkAssertions";
import { checkParents } from "./_internal/checkParents";
import { checkEnvironment } from "./_internal/checkEnvironment";
import { checkAvailability } from "./_internal/checkAvailability";
import { checkEntityFeature } from "./_internal/checkEntityFeature";
import { checkServiceStatus } from "./_internal/checkServiceStatus";

/**
 * Type to allow either an entity or and entity and label to be
 * passed into `checkPermission`
 */
export type EntityOrOptions =
  | Record<string, any>
  | {
      entity?: Record<string, any>;
      label: string;
    };

/**
 * Check a permission against the system policies, and possibly an entity policy
 * Note: Calls that fail will automatically be logged to the console. Additional
 * context for the call can be passed via `.label` on the `entityOrOptions` argument.
 * @param permission
 * @param context
 * @param entityOrOptions
 * @returns
 */
export function checkPermission(
  permission: Permission,
  context: IArcGISContext,
  entityOrOptions?: EntityOrOptions
): IPermissionAccessResponse {
  const label = entityOrOptions?.label || "";
  const entity = entityOrOptions?.entity || entityOrOptions;
  // Default to granted
  let response: IPermissionAccessResponse = {
    policy: permission,
    access: true,
    response: "granted",
    code: getPolicyResponseCode("granted"),
    checks: [],
  };
  // Is this even a valid permission?
  if (!isPermission(permission)) {
    response = {
      policy: permission,
      access: false,
      response: "invalid-permission",
      code: getPolicyResponseCode("invalid-permission"),
      checks: [],
    } as IPermissionAccessResponse;
  } else {
    // Get the system policy for this permission
    const systemPolicy = getPermissionPolicy(permission);

    // TODO: handle null systemPolicy

    const checks = [
      checkParents,
      checkServiceStatus,
      checkEntityFeature,
      checkAuthentication,
      checkEnvironment,
      checkAvailability,
      checkLicense,
      checkPrivileges,
      checkOwner,
      checkEdit,
      checkAssertions,
      checkAlphaGating, // TODO: Remove with Capability Refactor
    ].reduce((acc: IPolicyCheck[], fn) => {
      acc = [...acc, ...fn(systemPolicy, context, entity)];
      return acc;
    }, []);

    // For system policies, all conditions must be met, so we can
    // iterate through the checks and set the response to the first failure
    // while still returning all the checks for observability
    checks.forEach((check) => {
      if (check.response !== "granted" && response.response === "granted") {
        response.response = check.response;
        response.code = check.code;
        response.access = false;
      }
    });

    response.checks = checks;

    // Entity policies are treated as "grants" so we only need to pass one
    if (entity) {
      const entityPolicies: IEntityPermissionPolicy[] = getWithDefault(
        entity,
        "permissions",
        []
      );

      const entityPermissionPolicies = entityPolicies.filter(
        (e) => e.permission === permission
      );
      // Entity Policies are "grants" in that only one needs to pass
      // but we still want each check returned so we can see why they
      // got access or got denied
      const entityChecks = entityPermissionPolicies.map((policy) => {
        return checkEntityPolicy(policy, context);
      });
      // Process them to see if any grant access
      const grantedCheck = entityChecks.find((e) => e.response === "granted");
      // If we did not find a check that grants access, AND we've passed
      // all the system checks, then we set the response to "not-granted"
      // and set the access to false
      if (
        entityChecks.length &&
        !grantedCheck &&
        response.response === "granted"
      ) {
        response.access = false;
        response.response = "not-granted";
      }
      // Merge in the entity checks...
      response.checks = [...response.checks, ...entityChecks];
    }
  }

  // log denied access information
  if (!response.access) {
    // tslint:disable-next-line:no-console
    console.info(
      `checkPermission: ${label} ${permission} : ${response.response}`
    );
    // tslint:disable-next-line:no-console
    console.dir(response);
    // tslint:disable-next-line:no-console
    console.info(`-----------------------------------------`);
  }
  return response;
}
