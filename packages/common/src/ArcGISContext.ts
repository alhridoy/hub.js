import {
  IUser,
  IUserRequestOptions,
  UserSession,
} from "@esri/arcgis-rest-auth";
import { IPortal } from "@esri/arcgis-rest-portal";
import { IRequestOptions } from "@esri/arcgis-rest-request";
import { HubServiceStatus } from "./core";
import { getProp, getWithDefault } from "./objects";
import { HubEnvironment, HubLicense, IFeatureFlags } from "./permissions/types";
import { IHubRequestOptions, IHubTrustedOrgsResponse } from "./types";
import { getEnvironmentFromPortalUrl } from "./utils/getEnvironmentFromPortalUrl";
import { IUserResourceToken, UserResourceApp } from "./ArcGISContextManager";

/**
 * Hash of Hub API end points so updates
 * are centralized
 */
const hubApiEndpoints = {
  domains: "/api/v3/domains",
  search: "/api/v3/datasets",
  discussions: "/api/discussions/v1",
};

/**
 * Defines the properties of the ArcGISContext.
 * Typically components or functions will get an instance
 * of `ArcGISContext` from `ArcGISContetManager`.
 *
 * `ArcGISContext` implements this interface, and uses
 * getters to simplify the derivation of various complex properties.
 *
 */
export interface IArcGISContext {
  /**
   * Unique id from the ArcGISContextManager that created
   * this instance. Primarily useful for debugging possible
   * race-conditions that can result in multiple ArcGISContextManager
   * instances being created.
   */
  id: number;
  /**
   * Return the UserSession if authenticated
   */
  session: UserSession;
  /**
   * Return boolean indicating if authenticatio is present
   */
  isAuthenticated: boolean;
  /**
   * Return `IUserRequestOptions`, which is used for REST-JS
   * functions which require authentication information.
   *
   * If context is not authenticated, this function will return `undefined`
   */
  userRequestOptions: IUserRequestOptions;
  /**
   * Return `IRequestOptions`, which is used by REST-JS functions
   * which *may* use authentication information if provided.
   *
   * If context is not authenticated, this function just returns
   * the `portal` property, which informs REST-JS what Sharing API
   * instance to use (i.e. AGO, Enterprise etc)
   */
  requestOptions: IRequestOptions;
  /**
   * Return a `IHubRequestOptions` object
   *
   * If context is not authenticated, this function will return `undefined`
   */
  hubRequestOptions: IHubRequestOptions;
  /**
   * Return the portal url.
   *
   * If authenticated @ ArcGIS Online, it will return
   * the https://org.env.arcgis.com
   *
   * If authenticated @ ArcGIS Enterprise, it will return
   * https://{portalHostname}/{webadaptor}
   */
  portalUrl: string;
  /**
   * Returns the url to the sharing api composed from portalUrl
   * i.e. https://myorg.maps.arcgis.com/sharing/rest
   */
  sharingApiUrl: string;
  /**
   * Returns the Hub url, based on the portalUrl
   *
   * For ArcGIS Enterprise this will return `undefined`
   */
  hubUrl: string;
  /**
   * Returns the current user's hub-home url. If not authenticated,
   * returns the Hub Url. If portal, returns undefined
   */
  hubHomeUrl: string;
  /**
   * Returns boolean indicating if the backing system
   * is ArcGIS Enterprise (formerly ArcGIS Portal) or not
   */
  isPortal: boolean;
  /**
   * Returns the discussions API URL
   */
  discussionsServiceUrl: string;

  /**
   * Returns the Hub Search API URL
   */
  hubSearchServiceUrl: string;
  /**
   * Returns Hub Domain Service URL
   */
  domainServiceUrl: string;
  /**
   * Returns the Events configuration object from portal/self
   *
   * `{serviceId: '3ef..', publicViewId: 'bc3...'}`
   */
  eventsConfig: any;
  /**
   * Returns boolean indicating if the current user
   * belongs to an organization that has licensed
   * ArcGIS Hub
   */
  hubEnabled: boolean;
  /**
   * Return Hub Community Org Id, if defined
   */
  communityOrgId: string;
  /**
   * Returns the Community Org Hostname, if defined
   */
  communityOrgHostname: string;
  /**
   * Returns the Hub Community Org url
   *
   * i.e. https://c-org.maps.arcgis.com
   */
  communityOrgUrl: string;
  /**
   * Returns the hash of helper services from portal self
   */
  helperServices: any;
  /**
   * Returns the current user
   */
  currentUser: IUser;
  /**
   * Returns the portal object
   */
  portal: IPortal;

  /**
   * What is the current user's hub license level?
   */
  hubLicense: HubLicense;

  /**
   * Additional app-specific context
   */
  properties: Record<string, any>;

  /**
   * Hub Service Status
   */
  serviceStatus: HubServiceStatus;

  /**
   * Is this user in a Hub Alpha org?
   * Derived from properties.alphaOrgs
   */
  isAlphaOrg: boolean;
  /**
   * Is this user in a Hub Beta org?
   * Derived from properties.betaOrgs
   */
  isBetaOrg: boolean;

  /**
   * What environment is this running in?
   */
  environment: HubEnvironment;

  /**
   * Hash of feature flags
   */
  featureFlags: IFeatureFlags;

  /**
   * Array of Trusted Org Ids
   */
  trustedOrgIds: string[];

  /**
   * Trusted orgs xhr response
   */
  trustedOrgs: IHubTrustedOrgsResponse[];
  /**
   * Array of exchanged tokens for use
   * with user-app-resources
   */
  userResourceTokens?: IUserResourceToken[];

  /**
   * Return the token for a given app, if defined
   * @param app
   */
  tokenFor(app: UserResourceApp): string;
}

/**
 * Options for the ArcGISContext constructor
 */
export interface IArcGISContextOptions {
  /**
   * Unique id from the ArcGISContextManager that created
   * this instance. Primarily useful for debugging possible
   * race-conditions that can result in multiple ArcGISContextManager
   * instances being created.
   */
  id: number;
  /**
   * Portal base url
   * For ArcGIS Online - https://org.env.arcgis.com
   * For ArcGIS Enterprise - https://{portalHostname}/{webadaptor}
   */
  portalUrl: string;
  /**
   * Hub Url that corresponds to the portal url is appropritate
   */
  hubUrl?: string;
  /**
   * The current UserSession
   */
  authentication?: UserSession;
  /**
   * If the user is authenticated, the portal should be passed in
   * so various getters can work as expected.
   *
   * ArcGISContextManager handles this internally
   */
  portalSelf?: IPortal;
  /**
   * If the user is authenticated, the user should be passed in
   * so various getters can work as expected.
   *
   * ArcGISContextManager handles this internally
   */
  currentUser?: IUser;

  /**
   * Optional hash of additional context
   */
  properties?: Record<string, any>;

  /**
   * Option to pass in service status vs fetching it
   */
  serviceStatus?: HubServiceStatus;

  /**
   * Hash of feature flags
   */
  featureFlags?: IFeatureFlags;

  /**
   * Array of Trusted Org Ids
   */
  trustedOrgIds?: string[];

  /**
   * Trusted orgs xhr response
   */
  trustedOrgs?: IHubTrustedOrgsResponse[];

  /**
   * Array of exchanged tokens for use
   * with user-app-resources
   */
  userResourceTokens?: IUserResourceToken[];
}

/**
 * Abstraction that holds a `UserSession`, along with
 * getters to streamline access to various platform
 * urls, and common constructs like `IRequestOptions`,
 * `IUserRequestOptions` etc.
 *
 * Instances are intended to be immutable, but this is not directly enforced.
 *
 * In most circumstances, this class should be created by
 * the ArcGISContextManager class.
 */
export class ArcGISContext implements IArcGISContext {
  /**
   * Unique id from the ArcGISContextManager that created
   * this instance. Primarily useful for debugging possible
   * race-conditions that can result in multiple ArcGISContextManager
   * instances being created.
   */
  public id: number;
  private _authentication: UserSession;

  private _portalUrl: string = "https://www.arcgis.com";

  private _hubUrl: string;

  private _hubHomeUrl: string;

  private _portalSelf: IPortal;

  private _currentUser: IUser;

  private _properties: Record<string, any>;

  private _serviceStatus: HubServiceStatus;

  private _featureFlags: IFeatureFlags = {};

  private _trustedOrgIds: string[];

  private _trustedOrgs: IHubTrustedOrgsResponse[];

  private _userResourceTokens: IUserResourceToken[] = [];

  /**
   * Create a new instance of `ArcGISContext`.
   *
   * @param opts
   */
  constructor(opts: IArcGISContextOptions) {
    this.id = opts.id;
    this._portalUrl = opts.portalUrl;
    this._hubUrl = opts.hubUrl;
    this._serviceStatus = opts.serviceStatus;
    if (opts.authentication) {
      this._authentication = opts.authentication;
    }

    if (opts.portalSelf) {
      this._portalSelf = opts.portalSelf;
    }

    if (opts.currentUser) {
      this._currentUser = opts.currentUser;
    }
    if (opts.properties) {
      this._properties = opts.properties;
    }

    if (opts.trustedOrgIds) {
      this._trustedOrgIds = opts.trustedOrgIds;
    }

    if (opts.trustedOrgs) {
      this._trustedOrgs = opts.trustedOrgs;
    }

    this._featureFlags = opts.featureFlags || {};
    this._userResourceTokens = opts.userResourceTokens || [];
  }

  /**
   * Return the UserSession if authenticated
   */
  public get session(): UserSession {
    return this._authentication;
  }

  /**
   * Return boolean indicating if authenticatio is present
   */
  public get isAuthenticated(): boolean {
    return !!this._authentication;
  }

  /**
   * Return hash of feature flags passed into constructor.
   * Default is empty object.
   */
  public get featureFlags(): IFeatureFlags {
    return this._featureFlags;
  }

  /**
   * Is the users org in the alpha orgs list?
   * Alpha orgs are passed in via properties.alphaOrgs
   */
  public get isAlphaOrg(): boolean {
    let result = false;
    const orgs = this._properties?.alphaOrgs || [];
    const orgId = this._portalSelf?.id;
    if (orgs.length && orgId) {
      result = orgs.includes(orgId);
    }
    return result;
  }

  /**
   * Is the users org in the beta orgs list?
   * Beta orgs are passed in via properties.betaOrgs
   */
  public get isBetaOrg(): boolean {
    let result = false;
    const orgs = this._properties?.betaOrgs || [];
    const orgId = this._portalSelf?.id;
    if (orgs.length && orgId) {
      result = orgs.includes(orgId);
    }
    return result;
  }

  /**
   * Return the HubEnvironment of the current context
   */
  public get environment(): HubEnvironment {
    return getEnvironmentFromPortalUrl(this._portalUrl);
  }

  /**
   * Return `IUserRequestOptions`, which is used for REST-JS
   * functions which require authentication information.
   *
   * If context is not authenticated, this function will throw
   */
  public get userRequestOptions(): IUserRequestOptions {
    if (this.isAuthenticated) {
      return {
        authentication: this._authentication,
        portal: this.sharingApiUrl,
      };
    }
  }

  /**
   * Return `IRequestOptions`, which is used by REST-JS functions
   * which *may* use authentication information if provided.
   *
   * If context is not authenticated, this function just returns
   * the `portal` property, which informs REST-JS what Sharing API
   * instance to use (i.e. AGO, Enterprise etc)
   */
  public get requestOptions(): IRequestOptions {
    let ro: any = {
      portal: this.sharingApiUrl,
    };
    if (this.isAuthenticated) {
      ro = {
        authentication: this._authentication,
        portal: this.sharingApiUrl,
      };
    }
    return ro;
  }

  /**
   * Return a `IHubRequestOptions` object
   */
  public get hubRequestOptions(): IHubRequestOptions {
    // We may add more logic around what is returned in some corner cases

    return {
      authentication: this.session,
      isPortal: this.isPortal,
      portalSelf: this.portal,
      hubApiUrl: this.hubUrl,
      portal: this.sharingApiUrl,
    };
  }

  /**
   * Return the portal url i.e. https://www.arcgis.com
   *
   * If authenticated @ ArcGIS Online, it will return
   * the https://org.env.arcgis.com
   *
   * If authenticated @ ArcGIS Enterprise, it will return
   * https://{portalHostname}/{webadaptor}
   */
  public get portalUrl(): string {
    if (this.isAuthenticated) {
      if (this.isPortal || !this._portalSelf.urlKey) {
        return `https://${this._portalSelf.portalHostname}`;
      } else {
        return `https://${this._portalSelf.urlKey}.${this._portalSelf.customBaseUrl}`;
      }
    } else {
      return this._portalUrl;
    }
  }

  /**
   * Returns the current user's hub-home url. If not authenticated,
   * returns the Hub Url. If portal, returns undefined
   */
  public get hubHomeUrl(): string {
    if (this.isPortal) {
      return undefined;
    } else {
      if (this.isAuthenticated) {
        const hubHostname = this._hubUrl.replace("https://", "");
        return `https://${this._portalSelf.urlKey}.${hubHostname}`;
      } else {
        return this._hubUrl;
      }
    }
  }

  /**
   * Returns the current user's Hub License
   */
  get hubLicense(): HubLicense {
    if (this.isPortal) {
      return "enterprise-sites";
    } else {
      if (this.hubEnabled) {
        return "hub-premium";
      } else {
        return "hub-basic";
      }
    }
  }

  /**
   * Returns the current hub service status information
   */
  get serviceStatus(): HubServiceStatus {
    return this._serviceStatus;
  }

  /**
   * Returns the url to the sharing api composed from portalUrl
   * i.e. https://myorg.maps.arcgis.com/sharing/rest
   */
  public get sharingApiUrl(): string {
    return `${this.portalUrl}/sharing/rest`;
  }

  /**
   * Returns the Hub url, based on the portalUrl
   *
   * For ArcGIS Enterprise this will return `undefined`
   */
  public get hubUrl(): string {
    return this._hubUrl;
  }

  /**
   * Returns boolean indicating if the backing system
   * is ArcGIS Enterprise (formerly ArcGIS Portal) or not
   */
  public get isPortal(): boolean {
    return this._portalSelf
      ? this._portalSelf.isPortal
      : this._portalUrl.indexOf("arcgis.com") === -1;
  }

  /**
   * Returns the discussions API URL
   */
  public get discussionsServiceUrl(): string {
    if (this._hubUrl) {
      return `${this._hubUrl}${hubApiEndpoints.discussions}`;
    }
  }

  /**
   * Returns the Hub Search API URL
   */
  public get hubSearchServiceUrl(): string {
    if (this._hubUrl) {
      return `${this._hubUrl}${hubApiEndpoints.search}`;
    }
  }

  /**
   * Returns Hub Domain Service URL
   */
  public get domainServiceUrl(): string {
    if (this._hubUrl) {
      return `${this._hubUrl}${hubApiEndpoints.domains}`;
    }
  }

  /**
   * Returns the Events configuration object from portal/self
   *
   * `{serviceId: '3ef..', publicViewId: 'bc3...'}`
   */
  public get eventsConfig(): any {
    if (this._portalSelf) {
      return getProp(this._portalSelf, "portalProperties.hub.settings.events");
    }
  }

  /**
   * Returns boolean indicating if the current user
   * belongs to an organization that has licensed
   * ArcGIS Hub
   */
  public get hubEnabled(): boolean {
    return getWithDefault(
      this._portalSelf,
      "portalProperties.hub.enabled",
      false
    );
  }

  /**
   * Return the Hub Community Org Id, if defined
   */
  public get communityOrgId(): string {
    if (this._portalSelf) {
      return getProp(
        this._portalSelf,
        "portalProperties.hub.settings.communityOrg.orgId"
      );
    }
  }

  /**
   * Returns the Hub Community Org Hostname, if defined
   *
   * i.e. c-org.maps.arcgis.com
   */
  public get communityOrgHostname(): string {
    if (this._portalSelf) {
      return getProp(
        this._portalSelf,
        "portalProperties.hub.settings.communityOrg.portalHostname"
      );
    }
  }

  /**
   * Returns the Hub Community Org url
   *
   * i.e. https://c-org.maps.arcgis.com
   */
  public get communityOrgUrl(): string {
    if (this.communityOrgHostname) {
      return `https://${this.communityOrgHostname}`;
    }
  }

  /**
   * Returns the hash of helper services from portal self
   */
  public get helperServices(): any {
    if (this._portalSelf) {
      return this._portalSelf.helperServices;
    }
  }

  /**
   * Returns the current user as IUser
   */
  public get currentUser(): IUser {
    return this._currentUser;
  }

  /**
   * Returns the portal object as IPortal
   */
  public get portal(): IPortal {
    return this._portalSelf;
  }

  /**
   * Return the properties hash that was passed in.
   * Useful for app-specific context such as the active
   * Site for ArcGIS Hub
   */
  public get properties(): Record<string, any> {
    return this._properties;
  }

  /**
   * Returns the array of Trusted Org Ids
   */
  public get trustedOrgIds(): string[] {
    return this._trustedOrgIds;
  }

  /**
   * Returns the array of Trusted Orgs
   */
  public get trustedOrgs(): IHubTrustedOrgsResponse[] {
    return this._trustedOrgs;
  }

  /**
   * Return the whole array of user resource tokens
   */
  public get userResourceTokens(): IUserResourceToken[] {
    return this._userResourceTokens;
  }

  /**
   * Return a token for a specific app
   * @param app
   * @returns
   */
  public tokenFor(app: UserResourceApp): string {
    const entry = this._userResourceTokens.find((e) => e.app === app);
    if (entry) {
      return entry.token;
    }
  }
}
