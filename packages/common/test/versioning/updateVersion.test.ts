import { IModel } from "../../src/types";
import * as portalModule from "@esri/arcgis-rest-portal";
import { updateVersion } from "../../src/versioning/updateVersion";
import { IHubUserRequestOptions } from "../../src/types";
import { MOCK_AUTH } from "../mocks/mock-auth";
import { VERSION_RESOURCE_NAME } from "../../src/versioning/_internal/constants";
import * as objectToJsonBlobModule from "../../src/resources/object-to-json-blob";
import * as utilModule from "../../src/util";
import { IVersion } from "../../src";

describe("createVersion", () => {
  let portal: string;
  let hubApiUrl: string;
  let requestOpts: IHubUserRequestOptions;
  beforeEach(() => {
    portal = MOCK_AUTH.portal;
    hubApiUrl = "https://hubfake.arcgis.com";
    requestOpts = {
      portal,
      isPortal: false,
      hubApiUrl,
      authentication: MOCK_AUTH,
    };
  });

  it("should create a version", async () => {
    const model = {
      item: {
        id: "abc123",
        owner: "paige_pa",
        type: "Hub Site Application",
      },
      data: {
        values: {
          layout: "layout",
        },
      },
    } as unknown as IModel;

    const versionBlob = { size: 123 };

    const version: IVersion = {
      created: "9876543210",
      creator: "casey",
      data: {
        data: {
          values: {
            layout: "layout",
          },
        },
      },
      id: "def456",
      name: undefined,
      parent: undefined,
      path: "hubVersion_def456/version.json",
      updated: "9876543210",
      size: 123,
    } as unknown as IVersion;

    const updateItemResourceSpy = spyOn(
      portalModule,
      "updateItemResource"
    ).and.returnValue(Promise.resolve());
    spyOn(objectToJsonBlobModule, "objectToJsonBlob").and.returnValue(
      versionBlob
    );
    spyOn(utilModule, "createId").and.returnValue("def456");
    spyOn(Date, "now").and.returnValue("9876543210");

    const result = await updateVersion(model, version, requestOpts);

    const options = {
      ...requestOpts,
      id: "abc123",
      name: VERSION_RESOURCE_NAME,
      owner: "paige_pa",
      params: {
        properties: {
          created: "9876543210",
          creator: "casey",
          id: "def456",
          updated: "9876543210",
        },
      },
      prefix: "hubVersion_def456",
      private: true,
      resource: versionBlob,
    };

    expect(updateItemResourceSpy).toHaveBeenCalledTimes(1);
    expect(updateItemResourceSpy).toHaveBeenCalledWith(options);
    // expect(result).toEqual(versionResult);
  });
});