import { fetchHubTranslation, getProp } from "../../src";
import { IPortal } from "@esri/arcgis-rest-portal";
import * as fetchMock from "fetch-mock";

describe("fetchHubTranslation", function() {
  it("fetches a translation", async function() {
    const portal: IPortal = {
      name: "My Portal",
      id: "portal-id",
      isPortal: false,
      portalHostname: "devext.foo.bar"
    };

    const locale = "es";

    fetchMock.get(`end:/locales/${locale}.json`, { foo: { bar: "baz" } });

    const translation = await fetchHubTranslation("es", portal);

    expect(fetchMock.done()).toBeTruthy(
      "fetch called the expected number of times"
    );
    expect(getProp(translation, "foo.bar")).toEqual(
      "baz",
      "translation fetched successfully"
    );
  });
});
