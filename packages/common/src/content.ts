/* Copyright (c) 2019 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
import { IItem } from "@esri/arcgis-rest-portal";
import { HubType, HubFamily, IBBox, IHubGeography } from "./types";
import { collections } from "./collections";
import { categories, isDownloadable } from "./categories";
import { createExtent } from "./extent";
import { includes, isGuid } from "./utils";
import { IHubContent, IModel } from "./types";
import { getProp } from "./objects";
import { getStructuredLicense } from "./items/get-structured-license";

function collectionToFamily(collection: string): string {
  const overrides: any = {
    other: "content",
    solution: "template",
  };
  return overrides[collection] || collection;
}

function itemExtentToBoundary(extent: IBBox): IHubGeography {
  return (
    extent &&
    extent.length && {
      // TODO: center?
      geometry: createExtent(
        extent[0][0],
        extent[0][1],
        extent[1][0],
        extent[1][1]
      ),
    }
  );
}

const cache: { [key: string]: string } = {};

// TODO: remove this at next breaking version
/**
 * ```js
 * import { getCategory } from "@esri/hub-common";
 * //
 * getCategory('Feature Layer')
 * > 'dataset'
 * ```
 * **DEPRECATED: Use getCollection() instead**
 * returns the Hub category for a given item type
 * @param itemType The ArcGIS [item type](https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types.htm).
 * @returns the category of a given item type.
 */
export function getCategory(itemType: string = ""): string {
  /* tslint:disable no-console */
  console.warn(
    "DEPRECATED: Use getCollection() instead. getCategory will be removed at v9.0.0"
  );
  /* tslint:enable no-console */
  const collection = getCollection(itemType);
  // for backwards compatibility
  return collection === "feedback" ? "app" : collection;
}

/**
 * ```js
 * import { getTypes } from "@esri/hub-common";
 * //
 * getTypes('site')
 * > [ 'hub site application' ]
 * ```
 * To do.
 * @param category The ArcGIS Hub category.
 * @returns all the item types for the given category.
 *
 */
export function getTypes(category: string = ""): string[] {
  return categories[category.toLowerCase()];
}

/**
 * ```js
 * import { normalizeItemType } from "@esri/hub-common";
 * //
 * normalizeItemType(item)
 * > [ 'Hub Site Application' ]
 * ```
 * @param item Item object.
 * @returns type of the input item.
 *
 */
export function normalizeItemType(item: any = {}): string {
  let ret = item.type;
  const typeKeywords = item.typeKeywords || [];
  if (
    item.type === "Site Application" ||
    (item.type === "Web Mapping Application" &&
      includes(typeKeywords, "hubSite"))
  ) {
    ret = "Hub Site Application";
  }
  if (
    item.type === "Site Page" ||
    (item.type === "Web Mapping Application" &&
      includes(typeKeywords, "hubPage"))
  ) {
    ret = "Hub Page";
  }
  if (
    item.type === "Hub Initiative" &&
    includes(typeKeywords, "hubInitiativeTemplate")
  ) {
    ret = "Hub Initiative Template";
  }
  if (
    item.type === "Web Mapping Application" &&
    includes(typeKeywords, "hubSolutionTemplate")
  ) {
    ret = "Solution";
  }
  return ret;
}

/**
 * ```js
 * import { getTypeCategories } from "@esri/hub-common";
 * //
 * getTypeCategories(item)
 * > [ 'Hub Site Application' ]
 * ```
 * @param item Item object.
 * @returns typeCategory of the input item.
 *
 */
export function getTypeCategories(item: any = {}): string[] {
  const type: string = normalizeItemType(item);
  const category: string = getCategory(type);
  if (category) {
    // upper case first letter and return as element in array for backwards compatibility
    const chars = Array.from(category);
    chars[0] = chars[0].toUpperCase();
    return [chars.join("")];
  } else {
    return ["Other"];
  }
}

/**
 * ```js
 * import { getCollection } from "@esri/hub-common";
 * //
 * getCollection('Feature Layer')
 * > 'dataset'
 * ```
 * Get the Hub collection for a given item type
 * @param itemType The ArcGIS [item type](https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types.htm).
 * @returns the Hub collection of a given item type.
 */
export function getCollection(itemType: string = ""): string {
  if (cache[itemType]) {
    return cache[itemType];
  }
  for (const collection of Object.keys(collections)) {
    for (const type of collections[collection]) {
      if (itemType.toLowerCase() === type.toLowerCase()) {
        cache[itemType] = collection;
        return collection;
      }
    }
  }
}

/**
 * Case-insensitive check if the type is "Feature Service"
 * @param {string} type - item's type
 * @returns {boolean}
 */
export const isFeatureService = (type: string) => {
  return type && type.toLowerCase() === "feature service";
};

/**
 * parse layer id from a service URL
 * @param {string} url
 * @returns {string} layer id
 */
export const getLayerIdFromUrl = (url: string) => {
  const endsWithNumberSegmentRegEx = /\/\d+$/;
  const matched = url && url.match(endsWithNumberSegmentRegEx);
  return matched && matched[0].slice(1);
};

/**
 * return the layerId if we can tell that item is a single layer service
 * @param {*} item from AGO
 * @returns {string} layer id
 */
export const getItemLayerId = (item: IItem) => {
  // try to parse it from the URL, but failing that we check for
  // the Singlelayer typeKeyword, which I think is set when you create the item in AGO
  // but have not verified that, nor that we should alway return '0' in that case
  return (
    getLayerIdFromUrl(item.url) ||
    (isFeatureService(item.type) &&
      includes(item.typeKeywords, "Singlelayer") &&
      "0")
  );
};

/**
 * given an item, get the id to use w/ the Hub API
 * @param item
 * @returns Hub API id (hubId)
 */
export const getItemHubId = (item: IItem) => {
  if (item.access !== "public") {
    // the hub only indexes public items
    return;
  }
  const id = item.id;
  const layerId = getItemLayerId(item);
  return layerId ? `${id}_${layerId}` : id;
};

/**
 * ```js
 * import { getContentIdentifier } from "@esri/hub-common";
 * //
 * getContentIdentifier(content, site)
 * > 'f12hhjk32' // id
 * // OR
 * > 'content-slug' // human-readable slug
 * ```
 * Returns the preferred identifier for a piece of content (determined by content type):
 * - Content from the 'template' and 'feedback' families return the standard id field
 * - Pages that are linked to the site parameter will return the slug defined by the site. Otherwise, the page id will be returned
 * - All other content will return the highest available item in the following hierarchy:
 *   1. slug - includes org prefix if the site parameter is a portal or has an orgKey different from the slug prefix
 *   2. hubId
 *   3. id
 * @param content The IHubContent item
 * @param site The site to compare content against
 * @returns the preferred id for the given content.
 */
export function getContentIdentifier(
  content: IHubContent,
  site?: IModel
): string {
  // We don't currently support slugs for hub initiative templates, solutions or surveys
  if (includes(["template", "feedback"], content.family)) {
    return content.id;
  }

  // If it is a hub page linked to a site, return the page slug at the
  // site data instead. Because this one is the original one that was used
  // to create the page url (not mutable once created) and the slug (below)
  // generated by the hub-indexer could simply change with page name.

  // TODO: we check both "Hub Page" and "Site Page" because we don't know whether the site is a portal or not
  // In the future, the site object will have a site.isPortal() function that we can leverage
  // instead of hardcoding the types here.

  if (includes(["Hub Page", "Site Page"], content.type)) {
    // check if the page is linked to the current site
    const pages: IHubContent[] = getProp(site, "data.values.pages") || [];
    const page: IHubContent | undefined = pages.find(
      (p: any) => p.id === content.id
    );
    // if so, return the page slug otherwise the page id
    return page ? page.slug : content.id;
  }

  // If a slug is present, always return it
  if (content.slug) {
    let slug: string;
    const orgKey: string = getProp(site, "domainInfo.orgKey");
    // Use namespaced slug when on the umbrella site
    if (getProp(site, "data.values.isUmbrella")) {
      slug = content.slug;
    } else {
      // Use shortened slug if the slug's namespace is the same as the orgKey
      slug = removeContextFromSlug(content.slug, orgKey);
    }
    return slug;
  }

  return content.hubId || content.id;
}

//////////////////////
// Slug Helpers
//////////////////////

/**
 * Parse item ID and layer ID (if any) from dataset record ID
 *
 * @param datasetId Hub API dataset record id ({itemId}_{layerId} or {itemId})
 * @returns A hash with the `itemId` and `layerId` (if any)
 */
export function parseDatasetId(datasetId: string): {
  itemId: string;
  layerId?: string;
} {
  const [itemId, layerId] = datasetId ? datasetId.split("_") : [];
  return { itemId, layerId };
}

/**
 * Determine if an identifier is a Hub API slug
 *
 * @param identifier Hub API slug ({orgKey}::{title-as-slug} or {title-as-slug})
 * or record id ((itemId}_{layerId} or {itemId})
 * @returns true if the identifier is valid _and_ is **not** a record id
 */
export function isSlug(identifier: string): boolean {
  const { itemId } = parseDatasetId(identifier);
  if (!itemId || isGuid(itemId)) {
    // it's either invalid, or an item id, or a dataset id
    return false;
  }
  // otherwise assume it's a slug
  return true;
}

/**
 * Add a context (prefix) to slug if it doesn't already have one
 *
 * @param slug Hub API slug (with or without context)
 * @param context usually a portal's orgKey
 * @returns slug with context ({context}::{slug})
 */
export function addContextToSlug(slug: string, context: string): string {
  // the slug has an org key already e.g. dc::crime-incidents
  if (/.+::.+/.test(slug)) {
    return slug;
    // the slug belongs to the org that owns the site e.g. crime-incidents
  } else {
    return `${context}::${slug}`;
  }
}

/**
 * Remove context (prefix) from a slug
 *
 * @param slug Hub API slug with context
 * @param context usually a portal's orgKey
 * @returns slug without context
 */
export function removeContextFromSlug(slug: string, context: string): string {
  if (context && slug.match(`${context}::`)) {
    return slug.split(`${context}::`)[1];
  } else {
    return slug;
  }
}

/**
 * Splits item category strings at slashes and discards the "Categories" keyword
 *
 * ```
 * ["/Categories/Boundaries", "/Categories/Planning and cadastre/Property records", "/Categories/Structure"]
 * ```
 * Should end up being
 * ```
 * ["Boundaries", "Planning and cadastre", "Property records", "Structure"]
 * ```
 *
 * @param _categories - an array of strings
 * @private
 */
export function parseItemCategories(_categories: string[]) {
  if (!_categories) return _categories;

  const exclude = ["categories", ""];
  const parsed = _categories.map((cat) => cat.split("/"));
  const flattened = parsed.reduce((acc, arr, _) => [...acc, ...arr], []);
  return flattened.filter((cat) => !includes(exclude, cat.toLowerCase()));
}

/**
 * return the Hub family given an item's type
 * @param type item type
 * @returns Hub family
 */
export function getFamily(type: string) {
  let family;
  // override default behavior for the rows that are highlighted in yellow here:
  // https://esriis.sharepoint.com/:x:/r/sites/ArcGISHub/_layouts/15/Doc.aspx?sourcedoc=%7BADA1C9DC-4F6C-4DE4-92C6-693EF9571CFA%7D&file=Hub%20Routes.xlsx&nav=MTBfe0VENEREQzI4LUZFMDctNEI0Ri04NjcyLThCQUE2MTA0MEZGRn1fezIwMTIwMEJFLTA4MEQtNEExRC05QzA4LTE5MTAzOUQwMEE1RH0&action=default&mobileredirect=true&cid=df1c874b-c367-4cea-bc13-7bebfad3f2ac
  switch ((type || "").toLowerCase()) {
    case "image service":
      family = "dataset";
      break;
    case "feature service":
    case "raster layer":
      // TODO: check if feature service has > 1 layer first?
      family = "map";
      break;
    case "microsoft excel":
      family = "document";
      break;
    case "cad drawing":
    case "feature collection template":
    case "report template":
      family = "content";
      break;
    default:
      // by default derive from collection
      family = collectionToFamily(getCollection(type));
  }
  return family as HubFamily;
}

/**
 * DEPRECATED: Use getFamily() instead.
 *
 * get the HubType for a given item or item type
 *
 * @param itemOrType an item or item.type
 */
export function getItemHubType(itemOrType: IItem | string): HubType {
  /* tslint:disable no-console */
  console.warn(
    "DEPRECATED: Use getFamily() instead. getItemHubType() will be removed at v9.0.0"
  );
  /* tslint:enable no-console */
  if (typeof itemOrType === "string") {
    itemOrType = { type: itemOrType } as IItem;
  }
  const itemType = normalizeItemType(itemOrType);
  // TODO: not all categories are Hub types, may need to validate
  return getCollection(itemType) as HubType;
}

/**
 * Convert a Portal item to Hub content
 *
 * @param item Portal Item
 * @returns Hub content
 * @export
 */
export function itemToContent(item: IItem): IHubContent {
  const createdDate = new Date(item.created);
  const createdDateSource = "item.created";
  const properties = item.properties;
  const normalizedType = normalizeItemType(item);
  const content = Object.assign({}, item, {
    // no server errors when fetching the item directly
    errors: [],
    // store a reference to the item
    item,
    // NOTE: this will overwrite any existing item.name, which is
    // The file name of the item for file types. Read-only.
    // presumably there to use as the default file name when downloading
    // we don't store item.name in the Hub API and we use name for title
    name: item.title,
    family: getFamily(normalizedType),
    // TODO: hubType is no longer used, remove it at next breaking change
    hubType: getItemHubType(item),
    normalizedType,
    categories: parseItemCategories(item.categories),
    itemCategories: item.categories,
    // can we strip HTML from description, and do we need to trim it to a X chars?
    summary: item.snippet || item.description,
    publisher: {
      name: item.owner,
      username: item.owner,
    },
    permissions: {
      visibility: item.access,
      control: item.itemControl || "view",
    },
    // Hub app configuration metadata from item properties
    actionLinks: properties && properties.links,
    hubActions: properties && properties.actions,
    metrics: properties && properties.metrics,
    isDownloadable: isDownloadable(item),
    // default boundary from item.extent
    boundary: itemExtentToBoundary(item.extent),
    license: { name: "Custom License", description: item.accessInformation },
    // dates and sources we will enrich these later...
    createdDate,
    createdDateSource,
    publishedDate: createdDate,
    publishedDateSource: createdDateSource,
    updatedDate: new Date(item.modified),
    updatedDateSource: "item.modified",
    structuredLicense: getStructuredLicense(item.licenseInfo),
  });
  return content;
}
