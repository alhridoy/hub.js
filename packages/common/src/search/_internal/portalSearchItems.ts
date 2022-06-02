import { IItem, ISearchOptions, searchItems } from "@esri/arcgis-rest-portal";
import {
  convertPortalItemResponseToFacets,
  enrichContentSearchResult,
  HubError,
} from "../..";

import { enrichPageSearchResult } from "../../pages/HubPages";
import { enrichProjectSearchResult } from "../../projects";
import { enrichSiteSearchResult } from "../../sites";
import { IHubRequestOptions } from "../../types";
import { expandFilter, serializeFilterGroupsForPortal } from "../filter-utils";
import {
  IFilterGroup,
  IHubSearchOptions,
  IHubSearchResponse,
  IHubSearchResult,
} from "../types";
import { getNextFunction } from "../utils";

/**
 * @private
 * Portal Search Implementation for Items
 * @param filterGroups
 * @param options
 * @returns
 */
export async function portalSearchItems(
  filterGroups: Array<IFilterGroup<"item">>,
  options: IHubSearchOptions
): Promise<IHubSearchResponse<IHubSearchResult>> {
  if (!options.requestOptions) {
    throw new HubError(
      "hubSearch",
      "requestOptions: IHubRequestOptions is required."
    );
  }
  // Expand the individual filters in each of the groups
  const expandedGroups = filterGroups.map((fg) => {
    fg.filters = fg.filters.map(expandFilter);
    return fg;
  });

  // Serialize the all the groups for portal
  const so = serializeFilterGroupsForPortal(expandedGroups);
  // Array of properties we want to copy from IHubSearchOptions to the ISearchOptions
  const props: Array<keyof IHubSearchOptions> = [
    "num",
    "sortField",
    "sortOrder",
    "include",
    "start",
    "requestOptions", // although requestOptions is not needed on ISearchOption we send it through so downstream fns have access to it
  ];
  // copy the props over
  props.forEach((prop) => {
    if (options.hasOwnProperty(prop)) {
      so[prop as keyof ISearchOptions] = options[prop];
    }
  });

  if (options.requestOptions.authentication) {
    so.authentication = options.requestOptions.authentication;
  } else {
    so.portal = options.requestOptions.portal;
  }

  // Aggregations
  if (options.aggFields?.length) {
    so.countFields = options.aggFields.join(",");
    so.countSize = options.aggLimit || 10;
  }
  return searchPortal(so);
}

/**
 * Internal portal search, which then converts `IItem`s to `IHubSearchResult`s
 * handling enrichments & includes along the way
 *
 * @param searchOptions
 * @returns
 */
async function searchPortal(
  searchOptions: ISearchOptions
): Promise<IHubSearchResponse<IHubSearchResult>> {
  // Execute portal search
  const resp = await searchItems(searchOptions);

  // create mappable fn that will handle the includes
  const fn = (item: IItem) => {
    return itemToSearchResult(
      item,
      searchOptions.includes,
      searchOptions.requestOptions
    );
  };

  // map over results
  const results = await Promise.all(resp.results.map(fn));

  // convert aggregations into facets
  const facets = convertPortalItemResponseToFacets(resp);

  // Construct the return
  return {
    total: resp.total,
    results,
    facets,
    hasNext: resp.nextStart > -1,
    next: getNextFunction<IHubSearchResult>(
      searchOptions,
      resp.nextStart,
      resp.total,
      searchPortal
    ),
  };
}

/**
 * Convert an `IItem` to a `IHubSearchResult`
 * Fetches the enrichments, and attaches them as directed in the `include` list
 * @param item
 * @param includes
 * @param requestOptions
 * @returns
 */
async function itemToSearchResult(
  item: IItem,
  includes: string[] = [],
  requestOptions?: IHubRequestOptions
): Promise<IHubSearchResult> {
  // based on the type, we delegate to type-specific functions
  // this allows each type to apply "default" enrichments
  let fn = enrichContentSearchResult;
  switch (item.type) {
    case "Hub Site Application":
    case "Site Application":
      fn = enrichSiteSearchResult;
      break;
    case "Hub Page":
    case "Site Page":
      fn = enrichPageSearchResult;
      break;
    case "Hub Project":
      fn = enrichProjectSearchResult;
      break;
  }
  return fn(item, includes, requestOptions);
}