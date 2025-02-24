import { IArcGISContext } from "../../ArcGISContext";
import { getCategoryItems } from "../../core/schemas/internal/getCategoryItems";
import { getLocationExtent } from "../../core/schemas/internal/getLocationExtent";
import { getLocationOptions } from "../../core/schemas/internal/getLocationOptions";
import { getTagItems } from "../../core/schemas/internal/getTagItems";
import { IUiSchema } from "../../core/schemas/types";
import { getThumbnailUiSchemaElement } from "../../core/schemas/internal/getThumbnailUiSchemaElement";
import { EntityEditorOptions } from "../../core/schemas/internal/EditorOptions";

/**
 * @private
 * constructs the edit uiSchema for Hub Sites.
 * This defines how the schema properties should
 * be rendered in the site editing experience
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
            labelKey: `${i18nScope}.fields.name.label`,
            scope: "/properties/name",
            type: "Control",
            options: {
              messages: [
                {
                  type: "ERROR",
                  keyword: "required",
                  icon: true,
                  labelKey: `${i18nScope}.fields.name.requiredError`,
                },
              ],
            },
          },
          {
            labelKey: `${i18nScope}.fields.summary.label`,
            scope: "/properties/summary",
            type: "Control",
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
            labelKey: `${i18nScope}.fields.description.label`,
            scope: "/properties/description",
            type: "Control",
            options: {
              control: "hub-field-input-rich-text",
              type: "textarea",
              helperText: {
                labelKey: `${i18nScope}.fields.description.helperText`,
              },
            },
          },
          getThumbnailUiSchemaElement(i18nScope, options),
          {
            labelKey: `${i18nScope}.fields.tags.label`,
            scope: "/properties/tags",
            type: "Control",
            options: {
              control: "hub-field-input-combobox",
              items: await getTagItems(
                options,
                context.portal.id,
                context.hubRequestOptions
              ),
              allowCustomValues: true,
              selectionMode: "multiple",
              placeholderIcon: "label",
              helperText: { labelKey: `${i18nScope}.fields.tags.helperText` },
            },
          },
          {
            labelKey: `${i18nScope}.fields.categories.label`,
            scope: "/properties/categories",
            type: "Control",
            options: {
              control: "hub-field-input-combobox",
              items: await getCategoryItems(
                context.portal.id,
                context.hubRequestOptions
              ),
              allowCustomValues: false,
              selectionMode: "multiple",
              placeholderIcon: "select-category",
              helperText: {
                labelKey: `${i18nScope}.fields.categories.helperText`,
              },
            },
          },
        ],
      },
      {
        type: "Section",
        labelKey: `${i18nScope}.sections.location.label`,
        options: {
          helperText: {
            labelKey: `${i18nScope}.sections.location.helperText`,
          },
        },
        elements: [
          {
            scope: "/properties/location",
            type: "Control",
            options: {
              control: "hub-field-input-location-picker",
              extent: await getLocationExtent(
                options,
                context.hubRequestOptions
              ),
              options: await getLocationOptions(
                options,
                context.portal.name,
                context.hubRequestOptions
              ),
            },
          },
        ],
      },
    ],
  };
};
