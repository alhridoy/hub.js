import { IArcGISContext } from "../..";
import { EntityEditorOptions } from "../../core/schemas/internal/EditorOptions";
import { getThumbnailUiSchemaElement } from "../../core/schemas/internal/getThumbnailUiSchemaElement";
import { IUiSchema, UiSchemaMessageTypes } from "../../core/schemas/types";
import { getRecommendedTemplatesCatalog } from "./getRecommendedTemplatesCatalog";

/**
 * @private
 * constructs the complete edit uiSchema for Hub Initiative Templates.
 * This defines how the schema properties should be rendered
 * in the initiative template editing experience.
 *
 * @param i18nScope
 * @param entity
 * @param context
 * @returns
 */
export const buildUiSchema = async (
  i18nScope: string,
  options: EntityEditorOptions,
  context: IArcGISContext
): Promise<IUiSchema> => {
  return {
    type: "Layout",
    elements: [
      {
        type: "Section",
        labelKey: `${i18nScope}.sections.basicInfo.label`,
        elements: [
          {
            type: "Control",
            scope: "/properties/name",
            labelKey: `${i18nScope}.fields.name.label`,
            options: {
              messages: [
                {
                  type: UiSchemaMessageTypes.error,
                  keyword: "required",
                  icon: true,
                  labelKey: `${i18nScope}.fields.name.requiredError`,
                },
              ],
            },
          },
          {
            type: "Control",
            scope: "/properties/previewUrl",
            labelKey: `${i18nScope}.fields.previewUrl.label`,
            options: {
              helperText: {
                labelKey: `${i18nScope}.fields.previewUrl.helperText`,
              },
              messages: [
                {
                  type: "ERROR",
                  keyword: "format",
                  icon: true,
                  labelKey: `${i18nScope}.fields.previewUrl.formatError`,
                },
                {
                  type: "ERROR",
                  keyword: "if",
                  hidden: true,
                },
              ],
            },
          },
          {
            type: "Control",
            scope: "/properties/summary",
            labelKey: `${i18nScope}.fields.summary.label`,
            options: {
              control: "hub-field-input-input",
              type: "textarea",
              rows: 4,
              helperText: {
                labelKey: `${i18nScope}.fields.summary.helperText`,
              },
            },
          },
          {
            type: "Control",
            scope: "/properties/description",
            labelKey: `${i18nScope}.fields.description.label`,
            options: {
              control: "hub-field-input-input",
              type: "textarea",
              helperText: {
                labelKey: `${i18nScope}.fields.description.helperText`,
              },
            },
          },
          getThumbnailUiSchemaElement(i18nScope, options),
        ],
      },
      {
        type: "Section",
        labelKey: `${i18nScope}.fields.recommendedTemplates.label`,
        elements: [
          {
            type: "Control",
            scope: "/properties/recommendedTemplates",
            options: {
              control: "hub-field-input-gallery-picker",
              targetEntity: "item",
              catalogs: getRecommendedTemplatesCatalog(
                context.currentUser,
                i18nScope
              ),
              facets: [
                {
                  label: `{{${i18nScope}.fields.recommendedTemplates.facets.sharing:translate}}`,
                  key: "access",
                  field: "access",
                  display: "multi-select",
                  operation: "OR",
                },
              ],
              canReorder: false,
              linkTarget: "workspaceRelative",
              pickerTitle: {
                labelKey: `${i18nScope}.fields.recommendedTemplates.pickerTitle`,
              },
            },
          },
        ],
      },
    ],
  };
};
