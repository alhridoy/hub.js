import { EditorType, UiSchemaElementOptions } from "../types";
import { IArcGISContext } from "../../../ArcGISContext";
import { ConfigurableEntity } from "./ConfigurableEntity";
import { ConfigOption } from "./configOptionHelpers";
import { getConfigOptions } from "./getConfigOptions";

/**
 * Construc the Editor Configuration Options for a given entity type
 * @param type
 * @param entity
 * @param context
 * @returns
 */
export async function getEditorConfigOptions(
  type: EditorType,
  entity: ConfigurableEntity,
  context: IArcGISContext
): Promise<UiSchemaElementOptions[]> {
  const entityType = type.split(":")[1];

  const standardOptions: ConfigOption[] = [
    "access",
    "location",
    "tags",
    "categories",
    "thumbnail",
    "groupsToShareTo",
  ];

  // Hash of options by entity type
  const options: Record<string, ConfigOption[]> = {
    project: [...standardOptions, "featuredImage", "featuredContentCatalogs"],
    content: [...standardOptions],
    discussion: [...standardOptions],
    initiative: [...standardOptions, "featuredImage"],
    site: [...standardOptions],
    page: [...standardOptions],
    group: ["access", "thumbnail"],
  };

  if (!options[entityType]) {
    // Adding this warning because this is very difficult to find
    /* tslint:disable no-console */
    console.warn(
      `The entity type: ${entityType} does not have an editor config option defined.`
    );
  }
  const entityOptions = options[entityType] || [];

  return getConfigOptions(entityOptions, entity, context);
}