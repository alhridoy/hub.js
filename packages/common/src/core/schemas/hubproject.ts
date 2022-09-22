import { IConfigurationSchema, IUiSchema } from "./types";

export const HubProjectSchema: IConfigurationSchema = {
  required: ["name"],
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 250,
    },
    summary: {
      type: "string",
      // TODO: Remove reliance on subtype as it's not valid json schema
      // Issue https://devtopia.esri.com/dc/hub/issues/3725
      subtype: "long-text",
    },
    description: {
      type: "string",
      // TODO: Remove reliance on subtype as it's not valid json schema
      // Issue https://devtopia.esri.com/dc/hub/issues/3725
      subtype: "long-text",
    },
  },
} as unknown as IConfigurationSchema;

/**
 * Minimal UI Schema for Hub Project
 */
export const HubProjectCreateUiSchema: IUiSchema = {
  type: "Layout",
  elements: [
    {
      labelKey: "{{i18nScope}}.name.label",
      scope: "/properties/name",
      type: "Control",
    },
    {
      labelKey: "{{i18nScope}}.summary.label",
      scope: "/properties/summary",
      type: "Control",
      options: {
        helperText: {
          labelKey: "{{i18nScope}}.summary.helperText",
        },
      },
    },
    {
      labelKey: "{{i18nScope}}.description.label",
      scope: "/properties/description",
      type: "Control",
      options: {
        helperText: {
          labelKey: "{{i18nScope}}.description.helperText",
        },
      },
    },
  ],
};

/**
 * Complete UI Schema for Hub Project
 */
export const HubProjectEditUiSchema: IUiSchema = {
  type: "Layout",
  elements: [
    {
      labelKey: "{{i18nScope}}.name.label",
      scope: "/properties/name",
      type: "Control",
    },
    {
      labelKey: "{{i18nScope}}.summary.label",
      scope: "/properties/summary",
      type: "Control",
      options: {
        helperText: {
          labelKey: "{{i18nScope}}.summary.helperText",
        },
      },
    },
    {
      labelKey: "{{i18nScope}}.description.label",
      scope: "/properties/description",
      type: "Control",
      options: {
        helperText: {
          labelKey: "{{i18nScope}}.description.helperText",
        },
      },
    },
  ],
};