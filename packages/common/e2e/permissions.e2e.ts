import { IGroup, IItem } from "@esri/arcgis-rest-portal";
import { IArcGISContext } from "../src/ArcGISContext";
import {
  checkPermission,
  fetchHubEntity,
  HubEntity,
  HubInitiative,
  HubProject,
  IHubInitiative,
  IHubProject,
} from "../src/index";
import Artifactory from "./helpers/Artifactory";
import config from "./helpers/config";

const TEST_INITIATIVE_ID = "7deb8b7bdb4f4fab973513ebb55cd9a6";

describe("Check Permissions", () => {
  let factory: Artifactory;
  const orgName = "hubPremium";
  let context: IArcGISContext;
  beforeAll(async () => {
    factory = new Artifactory(config);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
    const ctxMgr = await factory.getContextManager(orgName, "user");
    context = ctxMgr.context;
  });
  describe("hacking", () => {
    it("basic edit permission", async () => {
      // get a project
      const entity: HubEntity = await fetchHubEntity(
        "initiative",
        TEST_INITIATIVE_ID,
        context
      );

      const results = checkPermission("hub:site:edit", context, entity);
      expect(results.access).toBe(true);
    });
    it("default capabilities applied on load", async () => {
      const entity: HubEntity = await fetchHubEntity(
        "initiative",
        TEST_INITIATIVE_ID,
        context
      );

      const instance = HubInitiative.fromJson(
        entity as IHubInitiative,
        context
      );
      const chk = instance.checkCapability("details");
    });
  });
});