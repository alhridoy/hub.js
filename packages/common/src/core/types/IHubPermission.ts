/**
 * Structure of a Hub Permission
 */
export interface IHubPermission {
  /**
   * Unique identifier of the permission
   */
  id?: string;
  /**
   * What action is being enabled for the target
   */
  permission: HubPermission;
  /**
   * What is the target of the permission
   */
  target: PermissionTarget;
  /**
   * Id of the entity that this permission is granted for
   */
  targetId: string;
}

export type HubPermission =
  | "addEvent"
  | "createEvent"
  | "editEvent"
  | "deleteEvent"
  | "addInitiative"
  | "createInitiative"
  | "editInitiative"
  | "deleteInitiative"
  | "addProject"
  | "createProject"
  | "editProject"
  | "deleteProject";

export type PermissionTarget = "org" | "group" | "user";