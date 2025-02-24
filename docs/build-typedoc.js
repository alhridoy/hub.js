const spawn = require("cross-spawn");
const { join } = require("path");
const { readFile, writeFile } = require("fs");
const _ = require("lodash");
const OUTPUT = join(process.cwd(), "docs", "src", `typedoc.json`);
const { prettyifyUrl } = require("acetate/lib/utils.js");
const slug = require("slug");
const minimatch = require("minimatch");
const cheerio = require("cheerio");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();

(function generateTypeDoc() {

  return new Promise((resolve, reject) => {
    const typedoc = spawn(
      "typedoc",
      [
        "-json",
        OUTPUT,
        "--exclude",
        "**/*test.ts",
        "--ignoreCompilerErrors",
        // Updating to typedoc 0.17.x requires the following
        // "--mode",
        // "modules",
        "--module",
        "common",
        "--tsconfig",
        "./tsconfig.json",
        "--excludePrivate"
      ],
      {
        stdio: "inherit"
      }
    );

    typedoc.on("close", code => {
      if (code !== 0) {
        reject(code);
        return;
      }

      readFile(OUTPUT, (error, content) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(JSON.parse(content.toString()));
      });
    });
  })
    .then(json => {
      /**
       * `json.children` will be a list of all TypeScript files in our project.
       * We dont care about the files, we just need all their children so we reduce
       * to a single list of everything in the entire project.
       */
      return json.children.reduce(
        (allChildren, fileChildren) => allChildren.concat(fileChildren),
        []
      );
    })
    .then(children => {
      /**
       * We dont want TypeScript files that have been symlinked into `node_modules`
       * folders by Lerna so ignore any child whose source file has `node_modules`
       * in its `fileName`
       */
      return children.filter(
        c => !minimatch(c.sources[0].fileName, "**/node_modules/**")
      );
    })
    .then(children => {
      /**
       * We now only want children that are actual source files, not tests, so
       * filter out all children without `src` in their path.
       */
      return children.filter(c =>
        minimatch(c.sources[0].fileName, "**/src/**/*.ts")
      );
    })
    .then(children => {
      /**
       * Some children might be empty so there is nothing to document in them.
       * For example most `index.ts` files don't have anything besides `import`
       * or `export` so we can safely filter these children out.
       */
      return children.filter(c => !!c.children);
    })
    .then(children => {
      /**
       * The `name` of each child is wrapped in extra quote marks remove these
       * quote marks and add `.ts` back to the end of the `name`,
       */
      return children.map(child => {
        child.name = child.name.replace(/\"/g, "") + ".ts";
        return child;
      });
    })
    .then(children => {
      /**
       * Now determine which `package` each of our children belongs to based on
       * its name.
       */
      return children.map(child => {
        const parts = child.name.split("/");
        const first = _.first(parts);
        // as of https://github.com/Esri/hub.js/pull/381/commits/19e8c603f5c3ea639166ff6a24394158e2dd3217
        // the name seems to include "packages", as if it were run one folder up
        child.name = first === "packages"
          ? parts[1]
          : first;
        child.package = child.name;
        return child;
      });
    })
    .then(children => {
      /**
       * `children` is currently a list of all TypeScript source files in
       * `packages`. `children.children` is an array of all declarations in that
       * source file. We need to concat all `children.children` arrays together
       * into a giant array of all declarations in all packages.
       */
      return children.reduce((allChildren, child) => {
        if (!child.children) {
          console.log(child);
          return allChildren;
        }
        return allChildren.concat(
          child.children.map(c => {
            c.package = child.package;
            return c;
          })
        );
      }, []);
    })
    .then(declarations => {
      /**
       * Next we remove all children that are not exported out of their files.
       */
      return declarations.filter(
        declaration => declaration.flags && declaration.flags.isExported
      );
    })
    .then(declarations => {
      /**
       * Next we remove all marked @private.
       */
      return declarations.filter(declaration => {
        // verbose b/c we want to filter things where isPrivate is true
        let result = true;
        if (declaration.flags && declaration.flags.isPrivate) {
          result = false;
        }
        return result;
      });
    })
    .then(declarations => {
      const excludeList = [
        "encodeAgoQuery",
        "downloadableAgg",
        "downloadableFilter",
        "collectionAgg",
        "collectionFilter",
        "createAggs",
        "format",
        "hasApiAgg",
        "buildFilter",
        "createFilters",
        "encodeFilters",
        "groupIds",
        "handleFilter",
        "hasApiFilter",
        "computeItemsFacets",
        "formatItem",
        "calcHighlights",
        "getSortField",
        "isFilterable",
        "generateFilter",
        "agoFormatItemCollection",
        "encodeParams",
        "getPaths",
        "getItems",
      ];
      /**
       * Next we remove any declarations we want to excludeList from the API ref
       * and anything with u/UiSchema in the name (these files cause issues with Acetate)
       */
      return declarations
        .filter((declaration) => !excludeList.includes(declaration.name))
        .filter((d) => !d.name.includes("uiSchema"))
        .filter((d) => !d.name.includes("UiSchema"));
    })
    .then(declarations => {
      /**
       * Now that we have a list of all declarations across the entire project
       * we can begin to generate additional information about each declaration.
       * For example we can now determine the `src` of the page that will
       * be generated for this declaration. Each `declaration` will also have
       * `children` which we can generate and define an `icon` property for. These
       * additional properties, `src`, `pageUrl`, `icon` and `children` are then
       * merged into the `declaration`. This also adds a `title`, `description`
       * and `titleSegments` to each page which are used in the template for SEO.
       */
      return declarations.map(declaration => {
        const abbreviatedPackageName = declaration.package;
        const src = `hub.js/api/${abbreviatedPackageName}/${
          declaration.name
        }.html`;
        let children;

        if (declaration.children) {
          children = declaration.children.map(child => {
            child.icon = `tsd-kind-${slug(
              child.kindString
            ).toLowerCase()} tsd-parent-kind-${slug(
              declaration.kindString
            ).toLowerCase()}`;

            if (child.flags.isPrivate) {
              child.icon += ` tsd-is-private`;
            }

            if (child.flags.isProtected) {
              child.icon += ` tsd-is-protected`;
            }

            if (child.flags.isStatic) {
              child.icon += ` tsd-is-static`;
            }

            if (child.signatures) {
              child.signatures = child.signatures.map(sig => {
                sig.icon = child.icon;
                return sig;
              });
            }

            return child;
          });
        }

        declaration.title = declaration.name;
        declaration.titleSegments = ["API Reference"];
        declaration.description =
          declaration.comment && declaration.comment.shortText
            ? cheerio
                .load(md.render(declaration.comment.shortText))
                .text()
                .replace("\n", "")
            : "API Reference documentation for ${child.name}, part of ${declaration.package}.";

        return Object.assign(declaration, {
          src,
          pageUrl: prettyifyUrl(src),
          icon: `tsd-kind-${slug(declaration.kindString).toLowerCase()}`,
          children
        });
      });
    })
    .then(declarations => {
      /**
       * We now have a list of `declarations` that will be used to generate the
       * individual API reference pages, but we still need to generate a landing
       * page for each `package`. Return a new object with our `declarations` and
       * a new property `packages` which is an array of every `package` with a
       * page `src`, a `pageUrl`, an `icon` and a list of `declarations`. This
       * also adds a `title`, `description` and `titleSegments` to each page
       * which are used in the template for SEO.
       */
      const packagesToExclude = ['members', 'initiatives'];
      return {
        declarations,
        packages: _(declarations)
          .map(d => d.package)
          .uniq()
          .filter((pkg) => {
            return !packagesToExclude.includes(pkg);
          })
          .reduce((packages, package) => {
            const abbreviatedPackageName = package;
            const src = `hub.js/api/${abbreviatedPackageName}.html`;
            const pkg = require(`${process.cwd()}/packages/${package}/package.json`);

            packages.push({
              package,
              pkg,
              title: package,
              description: pkg.description,
              titleSegments: ["API Reference"],
              name: package,
              declarations: declarations
                .filter(d => d.package === package)
                .sort((da, db) => {
                  if (da.name.toLowerCase() < db.name.toLowerCase()) {
                    return -1;
                  }
                  if (da.name.toLowerCase() > db.name.toLowerCase()) {
                    return 1;
                  }
                  return 0;
                })
                .sort((da, db) => {
                  const types = [
                    "Function",
                    "Class",
                    "Object literal",
                    "Variable",
                    "Enumeration",
                    "Type alias",
                    "Interface"
                  ];

                  const aIndex = types.findIndex(t => da.kindString === t);
                  const bIndex = types.findIndex(t => db.kindString === t);

                  if (aIndex > bIndex) {
                    return 1;
                  } else if (aIndex < bIndex) {
                    return -1;
                  } else {
                    return 0;
                  }
                }),
                
              icon: "tsd-kind-module",
              src,
              pageUrl: prettyifyUrl(src)
            });
            return packages;
          }, [])
      };
    })
    .then(api => {
      /**
       * Since we generated the TypeDoc for the entire project at once each
       * `declaration` has a unique numerical `id` property. We occasionally
       * need to lookup a declaration by its `id` so we can prebuild an index of
       * them here.
       */
      api.index = api.declarations.reduce((index, declaration) => {
        index[declaration.id] = declaration;
        return index;
      }, {});

      return api;
    })
    .then(api => {
      /**
       * In order to power the API reference quick search we can build an array
       * of all declarations and child items
       */
      api.quickSearchIndex = api.declarations.reduce(
        (quickSearchIndex, declaration) => {
          if (declaration.children) {
            quickSearchIndex = quickSearchIndex.concat(
              declaration.children.map(child => {
                return {
                  title: `${declaration.name}.${child.name}`,
                  url: `${declaration.pageUrl}#${child.name}`,
                  icon: child.icon
                };
              })
            );
          }

          return quickSearchIndex.concat([
            {
              title: declaration.name,
              url: declaration.pageUrl,
              icon: declaration.icon
            }
          ]);
        },
        []
      );

      return api;
    })
    .then(api => {
      /**
       * Next we can sort the children of each declaration to sort by required/optional/inherited
       */
      api.declarations = api.declarations.map(declaration => {
        if (declaration.children) {
          declaration.children.sort((ca, cb) => {
            const aIndex = rankChild(ca);
            const bIndex = rankChild(cb);

            if (aIndex > bIndex) {
              return 1; // sort a below b
            } else if (aIndex < bIndex) {
              return -1; // sort a above b
            } else {
              return 0;
            }
            return 0;
          });
        }

        if (declaration.groups) {
          declaration.groups.forEach(group => {
            if (group.children) {
              group.children.sort((ca, cb) => {
                const childA = declaration.children.find(c => c.id === ca);
                const childB = declaration.children.find(c => c.id === cb);

                const aIndex = rankChild(childA);
                const bIndex = rankChild(childB);

                if (aIndex > bIndex) {
                  return 1;
                } else if (aIndex < bIndex) {
                  return -1;
                } else {
                  return 0;
                }
                return 0;
              });
            }
          });
        }

        return declaration;
      });

      return api;
    })
    .then(api => {
      api.generatedAt = new Date().toISOString();
      /**
       * Our final object looks like this:
       *
       * {
       *   generated: '2023-09-18T19:46:07.314Z'
       *   packages: [Array of packages.],
       *   declarations: [Array of each exported declaration accross all source files.]
       *   index: { Object mapping each declaration.id as a key with the declaration as its value}
       * }
       *
       * We now export this to the Acetate source directory.
       */
      return new Promise((resolve, reject) => {
        writeFile(OUTPUT, JSON.stringify(api, null, 2), (e) => {
          if (e) {
            reject(e);
            return;
          }

          resolve(api);
        });
      });
    })
    .catch(e => {
      console.error(e);
    });
})();

function rankChild(child) {
  const { isPrivate, isPublic, isOptional, isStatic } = child
    ? child.flags
    : {};

  const isInherited = child.inheritedFrom ? true : false;

  let score = 0;

  if (isPrivate) {
    score += 30;
  }
  if (isStatic) {
    score -= 15;
  }
  if (!isInherited) {
    score -= 5;
  }
  if (!isOptional) {
    score -= 15;
  }
  return score;
}