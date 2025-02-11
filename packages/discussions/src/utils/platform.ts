import { GroupMembership, IGroup, IUser } from "@esri/arcgis-rest-portal";

/**
 * Utility that returns reducer function that filters a user's groups
 * by membership type and produces an array of group id's
 *
 *
 * @export
 * @param {GroupMembership[]} membershipTypes
 * @return {*}  {((memo: string[], group: IGroup) => string[])}
 */
export function reduceByGroupMembership(
  membershipTypes: GroupMembership[]
): (memo: string[], group: IGroup) => string[] {
  return function (memo, group) {
    if (membershipTypes.indexOf(group.userMembership.memberType) > -1) {
      memo.push(group.id);
    }
    return memo;
  };
}

/**
 * Utility that checks if a user is a portal org admin (default role)
 *
 * @export
 * @param {IUser} user
 * @return {*}  {boolean}
 */
// NOTE: this is not the same as @esri/arcgis-rest-portal isOrgAdmin,
// which first resolves `user` from `IUserRequestOptions` to make this determination
// https://github.com/Esri/arcgis-rest-js/blob/7ab072184f89dcb35367518101ee4abeb5a9d112/packages/arcgis-rest-portal/src/sharing/helpers.ts#L45
export function isOrgAdmin(user: IUser): boolean {
  return user.role === "org_admin" && !user.roleId;
}
