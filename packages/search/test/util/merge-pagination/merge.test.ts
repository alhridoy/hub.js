import { mergePages } from "../../../src/util/merge-paginations/merge";

describe("Merge Paginations Function", () => {
  it("can properly merge pages from different sources, handling cases when nextStart is not specified", () => {
    // Setup
    const pages: any[] = [
      {
        label: "hub",
        nextPageStart: 13
      },
      {
        label: "ago",
        nextPageStart: 4
      },
      {
        label: "event"
      }
    ];

    const expectedResult: string = "eyJodWIiOjEzLCJhZ28iOjQsImV2ZW50IjoxfQ==";

    // Test
    const actualResult: string = mergePages(pages);

    // Assertions
    expect(expectedResult).toEqual(actualResult);
  });

  it("can correctly throw error for falsey input", () => {
    // Setup
    const pagesOne: undefined = undefined;
    const pagesTwo: null = null;

    // Test and Assert
    try {
      mergePages(pagesOne);
    } catch (err) {
      expect(err.message).toEqual(
        "Invalid Input Error. Must be array of IDataPageNextStart, received: undefined"
      );
    }

    try {
      mergePages(pagesTwo);
    } catch (err) {
      expect(err.message).toEqual(
        "Invalid Input Error. Must be array of IDataPageNextStart, received: null"
      );
    }
  });

  it("can correctly throw error for non-falsey, non-array input", () => {
    // Setup
    const pagesOne: any = () => ({});
    const pagesTwo: any = {};

    // Test and Assert
    try {
      mergePages(pagesOne);
    } catch (err) {
      expect(err.message).toEqual(
        "Invalid Input Error. Must be array of IDataPageNextStart, received: undefined"
      );
    }

    try {
      mergePages(pagesTwo);
    } catch (err) {
      expect(err.message).toEqual(
        "Invalid Input Error. Must be array of IDataPageNextStart, received: {}"
      );
    }
  });
});
