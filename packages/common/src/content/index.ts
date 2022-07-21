/* Copyright (c) 2019 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
import { IItem } from "@esri/arcgis-rest-portal";
import { IModel } from "../types";
import { getCollection } from "../collections";
import { categories as allCategories } from "../categories";
import { includes } from "../utils";
import { IHubContent } from "../core";
import { getProp } from "../objects";
import { getServiceTypeFromUrl } from "../urls";
import { getHubRelativeUrl, isPageType } from "./_internal";
import { camelize } from "../util";
import {
  normalizeItemType,
  getContentTypeIcon,
  composeContent,
} from "./compose";
import { getFamily } from "./get-family";
import { parseDatasetId, removeContextFromSlug } from "./slugs";
import { DatasetResource } from "./types";

// re-export functions used in this file
export * from "./compose";
export * from "./get-family";
export * from "./slugs";
export * from "./fetch";
export * from "./types";
export * from "./HubContent";
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
    "DEPRECATED: Use getCollection() instead. getCategory will be removed at v10.0.0"
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
  return allCategories[category.toLowerCase()];
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

  if (isPageType(content.type)) {
    // check if the page is linked to the current site
    const pages: IHubContent[] = getProp(site, "data.values.pages") || [];
    // if so, return the page slug otherwise the page id
    const page = pages.find((p: any) => p.id === content.id);
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

/**
 * Convert a Portal item to Hub content
 *
 * @param item Portal Item
 * @returns Hub content
 * @export
 */
export function itemToContent(item: IItem): IHubContent {
  return composeContent(item);
}

/**
 * Convert a Hub API dataset resource to Hub Content
 *
 * @param {DatasetResource} Dataset resource
 * @returns {IHubContent} Hub content object
 * @export
 */
export function datasetToContent(dataset: DatasetResource): IHubContent {
  // extract item from dataset, create content from the item
  const item = datasetToItem(dataset);

  // extract enrichments from attributes
  const {
    // item enrichments
    errors,
    boundary,
    metadata,
    slug,
    groupIds,
    orgId,
    orgName,
    organization,
    orgExtent,
    // map and feature server enrichments
    server,
    layers,
    layer,
    recordCount,
    statistics,
    // additional attributes needed
    extent,
    searchDescription,
  } = dataset.attributes;

  // get the layerId from the layer
  const layerId = layer && layer.id;

  // re-assemble the org as an enrichment
  const org = orgId && {
    id: orgId,
    name: orgName || organization,
    extent: orgExtent,
  };

  // compose a content out of the above
  return composeContent(item, {
    layerId,
    slug,
    errors,
    // setting this to null signals to enrichMetadata to skip this
    metadata: metadata || null,
    groupIds,
    org,
    server,
    layers,
    recordCount,
    boundary,
    extent,
    searchDescription,
    statistics,
  });
}

/**
 * Convert a Hub API dataset resource to a portal item
 *
 * @param {DatasetResource} Dataset resource
 * @returns {IItem} portal item
 * @export
 */
export function datasetToItem(dataset: DatasetResource): IItem {
  if (!dataset) {
    return;
  }
  const { id, attributes } = dataset;
  if (!attributes) {
    return;
  }

  // parse item id
  const { itemId } = parseDatasetId(id);

  // read item properties from attributes
  // NOTE: we attempt to read all item properties
  // even though some may not be currently returned
  const {
    // start w/ item properties from
    // https://developers.arcgis.com/rest/users-groups-and-items/item.htm
    owner,
    orgId,
    created,
    // the Hub API returns item.modified in attributes.itemModified (below)
    modified,
    // NOTE: we use attributes.name to store the title or the service/layer name
    // but in Portal name is only used for file types to store the file name (read only)
    name,
    title,
    type,
    typeKeywords,
    description,
    snippet,
    tags,
    thumbnail,
    // the Hub API returns item.extent in attributes.itemExtent (below)
    // extent,
    categories,
    contentStatus,
    // the Hub API doesn't currently return spatialReference
    spatialReference,
    // the Hub API doesn't currently return accessInformation
    accessInformation,
    licenseInfo,
    culture,
    url,
    access,
    // the Hub API doesn't currently return proxyFilter
    proxyFilter,
    properties,
    // the Hub API doesn't currently return appCategories, industries,
    // languages, largeThumbnail, banner, screenshots, listed, ownerFolder
    appCategories,
    industries,
    languages,
    largeThumbnail,
    banner,
    screenshots,
    listed,
    ownerFolder,
    size,
    // the Hub API doesn't currently return protected
    protected: isProtected,
    commentsEnabled,
    // the Hub API doesn't currently return numComments, numRatings,
    // avgRating, numViews, itemControl, scoreCompleteness
    numComments,
    numRatings,
    avgRating,
    numViews,
    itemControl,
    scoreCompleteness,
    // additional attributes we'll need
    // to derive the above values when missing
    itemExtent,
    itemModified,
    modifiedProvenance,
    serviceSpatialReference,
  } = attributes;

  // layer datasets will get their type from the layer
  // so we will need to derive the item type from the URL
  const serviceType = url && getServiceTypeFromUrl(url);

  // build and return an item from properties
  // NOTE: we currently do NOT provide default values
  // (i.e. null for scalar attributes, [] for arrays, etc)
  // for attributes that are not returned by the Hub API
  // this helps distinguish an item that comes from the API
  // but forces all consumers to do handle missing properties
  return {
    id: itemId,
    owner: owner as string,
    orgId,
    created: created as number,
    // for feature layers, modified will usually come from the layer so
    // we prefer itemModified, but fall back to modified if it came from the item
    modified: (itemModified ||
      (modifiedProvenance === "item.modified" && modified)) as number,
    title: (title || name) as string,
    type: serviceType || type,
    typeKeywords,
    description,
    tags,
    snippet,
    thumbnail,
    extent:
      itemExtent ||
      /* istanbul ignore next: API should always return itemExtent, but we default to [] just in case */ [],
    categories,
    contentStatus,
    spatialReference: spatialReference || serviceSpatialReference,
    accessInformation,
    licenseInfo,
    culture,
    url,
    access,
    size,
    protected: isProtected,
    proxyFilter,
    properties,
    appCategories,
    industries,
    languages,
    largeThumbnail,
    banner,
    screenshots,
    listed,
    ownerFolder,
    commentsEnabled,
    numComments,
    numRatings,
    avgRating,
    numViews,
    itemControl,
    scoreCompleteness,
  };
}

/**
 * returns a new content that has the specified type and
 * and updated related properties like, family, etc
 * @param content orignal content
 * @param type new type
 * @returns new content
 */
export const setContentType = (
  content: IHubContent,
  type: string
): IHubContent => {
  // get family and normalized type based on new type
  const normalizedType = normalizeItemType({ ...content.item, type });
  const family = getFamily(normalizedType);
  const contentTypeIcon = getContentTypeIcon(normalizedType);
  const contentTypeLabel = getContentTypeLabel(
    normalizedType,
    content.isProxied
  );
  const updated = {
    ...content,
    type: normalizedType,
    family,
    // TODO: remove this at next breaking change now that it has been deprecated
    normalizedType,
    contentTypeIcon,
    contentTypeLabel,
  };
  // update the relative URL to the content
  // which is based on type and family
  return appendContentUrls(updated, {
    relative: getContentRelativeUrl(updated),
  });
};

/**
 * Compute the content type label
 * @param contentType
 * @param isProxied
 * @returns content type label
 */
export const getContentTypeLabel = (
  contentType: string,
  isProxied: boolean
) => {
  return isProxied ? "CSV" : camelize(contentType || "");
};

/**
 * DEPRECATED returns a new content that has the specified hubId and updated identifier
 * @param content orignal content
 * @param hubId new hubId
 * @returns new content
 */
/* istanbul ignore next DEPRECATED and no longer in use */
export const setContentHubId = (
  content: IHubContent,
  hubId: string
): IHubContent => {
  const { id, slug } = content;
  // get the identifier which is based on hubId
  const identifier = slug || hubId || id;
  const updated = { ...content, hubId, identifier };
  // update the relative URL to the content
  // which is based on identifier
  return appendContentUrls(updated, {
    relative: getContentRelativeUrl(updated),
  });
};

/**
 * DEPRECATED: Calculates the relative and absolute urls for a given content on a specific site
 *
 * @param content
 * @param siteModel
 * @returns relative and absolute urls
 */
export const getContentSiteUrls = (content: IHubContent, siteModel: IModel) => {
  // compute relative URL using a site specific identifier
  const siteIdentifier = getContentIdentifier(content, siteModel);
  const relative = getContentRelativeUrl(content, siteIdentifier);
  // get the absolute URL to this content on the site
  const siteUrl = getProp(siteModel, "item.url").replace(/\/$/, "");
  const absolute = `${siteUrl}${relative}`;

  return { relative, absolute };
};

/**
 * append the absolute URL to the content on the site
 * also updates the relative URL in case the
 * @param content
 * @param siteModel
 * @returns
 */
export const setContentSiteUrls = (
  content: IHubContent,
  siteModel: IModel
): IHubContent => {
  const { relative, absolute: site } = getContentSiteUrls(content, siteModel);
  // append the updated URLs to a new content
  return appendContentUrls(content, {
    relative,
    site,
  });
};

// URL helpers
const appendContentUrls = (
  content: IHubContent,
  newUrls: Record<string, string>
): IHubContent => {
  // merge new urls into existing ones and return a new content
  const urls = { ...content.urls, ...newUrls };
  return { ...content, urls };
};

const getContentRelativeUrl = (
  content: IHubContent,
  siteIdentifier?: string
) => {
  return getHubRelativeUrl(
    content.type,
    siteIdentifier || content.identifier,
    content.typeKeywords
  );
};
