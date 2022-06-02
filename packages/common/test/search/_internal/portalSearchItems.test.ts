import * as Portal from "@esri/arcgis-rest-portal";
import {
  cloneObject,
  Filter,
  IFilterGroup,
  IHubSearchOptions,
  _searchContent,
} from "../../../src";

import * as SimpleResponse from "../../mocks/portal-search/simple-response.json";
import * as AllTypesResponse from "../../mocks/portal-search/response-with-key-types.json";
import { MOCK_AUTH } from "../../mocks/mock-auth";
import { portalSearchItems } from "../../../src/search/_internal/portalSearchItems";

describe("portalSearchItems:", () => {
  it("throws if requestOptions not passed in IHubSearchOptions", async () => {
    const f: IFilterGroup<"item"> = {
      operation: "AND",
      filterType: "item",
      filters: [
        {
          filterType: "item",
          term: "water",
        },
      ],
    };
    const opts: IHubSearchOptions = {};

    try {
      await portalSearchItems([f], opts);
    } catch (err) {
      expect(err.name).toBe("HubError");
      expect(err.message).toBe(
        "requestOptions: IHubRequestOptions is required."
      );
    }
  });
  it("search with all entities", async () => {
    const searchItemsSpy = spyOn(Portal, "searchItems").and.callFake(() => {
      return Promise.resolve(cloneObject(AllTypesResponse));
    });
    const f: IFilterGroup<"item"> = {
      operation: "AND",
      filterType: "item",
      filters: [
        {
          filterType: "item",
          term: "water",
        },
      ],
    };
    const opts: IHubSearchOptions = {
      requestOptions: {
        portal: "https://www.arcgis.com/sharing/rest",
      },
    };

    await portalSearchItems([f], opts);

    expect(searchItemsSpy.calls.count()).toBe(1, "should call searchItems");
    const [expectedParams] = searchItemsSpy.calls.argsFor(0);
    expect(expectedParams.portal).toEqual(opts.requestOptions.portal);
    expect(expectedParams.q).toEqual("water");
    expect(expectedParams.countFields).not.toBeDefined();
  });
  it("simple search with auth", async () => {
    const searchItemsSpy = spyOn(Portal, "searchItems").and.callFake(() => {
      return Promise.resolve(cloneObject(SimpleResponse));
    });
    const f: IFilterGroup<"item"> = {
      operation: "AND",
      filterType: "item",
      filters: [
        {
          filterType: "item",
          term: "water",
        },
      ],
    };
    const opts: IHubSearchOptions = {
      requestOptions: {
        portal: "https://www.arcgis.com/sharing/rest",
        authentication: MOCK_AUTH,
      },
    };

    await portalSearchItems([f], opts);

    expect(searchItemsSpy.calls.count()).toBe(1, "should call searchItems");
    const [expectedParams] = searchItemsSpy.calls.argsFor(0);
    expect(expectedParams.portal).toBeUndefined();
    expect(expectedParams.q).toEqual("water");
    expect(expectedParams.authentication).toEqual(
      opts.requestOptions.authentication
    );
    expect(expectedParams.countFields).not.toBeDefined();
  });
  it("simple search with aggregations", async () => {
    const searchItemsSpy = spyOn(Portal, "searchItems").and.callFake(() => {
      return Promise.resolve(cloneObject(SimpleResponse));
    });
    const f: IFilterGroup<"item"> = {
      operation: "AND",
      filterType: "item",
      filters: [
        {
          filterType: "item",
          term: "water",
        },
      ],
    };
    const opts: IHubSearchOptions = {
      aggFields: ["tags"],
      requestOptions: {
        portal: "https://www.arcgis.com/sharing/rest",
      },
    };

    await portalSearchItems([f], opts);

    expect(searchItemsSpy.calls.count()).toBe(1, "should call searchItems");
    const [expectedParams] = searchItemsSpy.calls.argsFor(0);
    // verify q
    expect(expectedParams.q).toEqual("water");
    expect(expectedParams.countFields).toEqual("tags");
    expect(expectedParams.countSize).toEqual(10);
  });
  it("simple search enterprise", async () => {
    const searchItemsSpy = spyOn(Portal, "searchItems").and.callFake(() => {
      return Promise.resolve(cloneObject(SimpleResponse));
    });
    const f: IFilterGroup<"item"> = {
      operation: "AND",
      filterType: "item",
      filters: [
        {
          filterType: "item",
          term: "water",
        },
      ],
    };
    const opts: IHubSearchOptions = {
      requestOptions: {
        portal: "https://my-portal.com/gis/sharing/rest",
      },
      aggFields: ["tags"],
      aggLimit: 100,
    };

    await portalSearchItems([f], opts);

    expect(searchItemsSpy.calls.count()).toBe(1, "should call searchItems");
    const [expectedParams] = searchItemsSpy.calls.argsFor(0);
    // verify q
    expect(expectedParams.q).toEqual("water");
    expect(expectedParams.countFields).toEqual("tags");
    expect(expectedParams.countSize).toEqual(100);
    expect(expectedParams.portal).toEqual(
      "https://my-portal.com/gis/sharing/rest"
    );
  });
  it("simple search next", async () => {
    const searchItemsSpy = spyOn(Portal, "searchItems").and.callFake(() => {
      return Promise.resolve(cloneObject(SimpleResponse));
    });
    const f: Filter<"content"> = {
      filterType: "content",
      term: "water",
    };
    const opts: IHubSearchOptions = {
      requestOptions: {
        portal: "https://www.arcgis.com/sharing/rest",
      },
    };

    const res = await _searchContent(f, opts);
    await res.next();
    expect(searchItemsSpy.calls.count()).toBe(2, "should call searchItems");
    const [expectedParams] = searchItemsSpy.calls.argsFor(1);
    // verify q
    expect(expectedParams.q).toEqual("water");
  });
});