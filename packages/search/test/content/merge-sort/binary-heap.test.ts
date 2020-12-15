import { BinaryHeap } from "../../../src/content/merge-sort/binary-heap";

describe("Binary Heap", () => {
  it("should successfully initialize if falsey nodes are explicitly provided", () => {
    // Setup
    const comparator = (one: number[], two: number[]): number => {
      if (one.length === 0) return two[0] ? 1 : 0;
      if (two.length === 0) return one[0] ? -1 : 0;
      return one[0] - two[0];
    };

    // Test
    const minHeapOne: BinaryHeap<number[]> = new BinaryHeap(null, comparator);
    const minHeapTwo: BinaryHeap<number[]> = new BinaryHeap(
      undefined,
      comparator
    );

    // Assertions
    expect(minHeapOne).toBeDefined();
    expect(minHeapOne.length()).toEqual(0);
    expect(minHeapTwo).toBeDefined();
    expect(minHeapTwo.length()).toEqual(0);
  });

  it("should fail to initialize if falsey comparators are explicitly provided", () => {
    // Setup
    let heap: BinaryHeap<string>;

    // Test
    try {
      heap = new BinaryHeap(null, undefined);
    } catch (err) {
      expect(err.message).toEqual("Comparator function must be defined");
    }

    try {
      heap = new BinaryHeap(null, null);
    } catch (err) {
      expect(err.message).toEqual("Comparator function must be defined");
    }
  });

  it("should fail to initialize if falsey heap direction is explicitly provided", () => {
    // Setup
    const comparator = (one: number[], two: number[]): number => {
      if (one.length === 0) return two[0] ? 1 : 0;
      if (two.length === 0) return one[0] ? -1 : 0;
      return one[0] - two[0];
    };

    let heap: BinaryHeap<number[]>;

    // Test
    try {
      heap = new BinaryHeap(null, comparator, undefined);
    } catch (err) {
      expect(err.message).toEqual("Provided heap direction is invalid");
    }

    try {
      heap = new BinaryHeap(null, comparator, null);
    } catch (err) {
      expect(err.message).toEqual("Provided heap direction is invalid");
    }
  });
});

describe("Min Binary Heap", () => {
  it("should be created correctly, with proper insertion and removal of data", () => {
    // Setup
    const first = { data: [2, 4, 9, 10, 11, 12], label: "0" };
    const second = { data: [1, 8, 10, 22], label: "1" };

    const lists = [first, second];

    const comparator = (one: number[], two: number[]): number => {
      if (one.length === 0) return two[0] ? 1 : 0;
      if (two.length === 0) return one[0] ? -1 : 0;
      return one[0] - two[0];
    };

    // Test
    const minHeap: BinaryHeap<number[]> = new BinaryHeap(lists, comparator);

    // Assertions
    // Assert minHeap has two nodes and they are in the correct order
    expect(minHeap).toBeDefined();
    expect(minHeap.length()).toEqual(2);
    expect(minHeap.heap()).toEqual([second, first]);

    // Assert that more nodes can be added and processed in proper order
    const third = { data: [-4, 0], label: "2" };

    minHeap.insert(third);
    expect(minHeap.length()).toEqual(3);
    expect(minHeap.heap()).toEqual([third, first, second]);

    // Assert that empty data array IS valid as data is not falsey
    const fourth = { data: [] as number[], label: "3" };

    minHeap.insert(fourth);
    expect(minHeap.length()).toEqual(4);
    expect(minHeap.heap()).toEqual([third, first, second, fourth]);

    // Assert that null data IS NOT valid as data is falsey
    const fifth = { data: null as number[], label: "4" };

    minHeap.insert(fifth);
    expect(minHeap.length()).toEqual(4);
    expect(minHeap.heap()).toEqual([third, first, second, fourth]);

    // Assert that data is removed in correct order
    const removedOne = minHeap.remove();
    expect(removedOne).toEqual(third);

    const removedTwo = minHeap.remove();
    expect(removedTwo).toEqual(second);

    const removedThree = minHeap.remove();
    expect(removedThree).toEqual(first);

    const removedFour = minHeap.remove();
    expect(removedFour).toEqual(fourth);

    const removedFive = minHeap.remove();
    expect(removedFive).toEqual(null);

    const removedSix = minHeap.remove();
    expect(removedSix).toEqual(null);
  });

  it("should be able to be created with more than 2 nodes", () => {
    // Setup
    const first = { data: "r string", label: "0" };
    const second = { data: "b string ", label: "1" };
    const third = { data: "z string ", label: "2" };
    const fourth = { data: "s string ", label: "3" };
    const fifth = { data: "a string ", label: "4" };
    const sixth = { data: "k string ", label: "5" };
    const seventh = { data: "y string ", label: "6" };
    const eighth = { data: "i string ", label: "8" };
    const nineth = { data: "d string ", label: "9" };
    const tenth = { data: "t string ", label: "10" };

    const lists = [
      first,
      second,
      third,
      fourth,
      fifth,
      sixth,
      seventh,
      eighth,
      nineth,
      tenth
    ];

    const comparator = (one: string, two: string): number => {
      if (one.length === 0) return two.length > 0 ? 1 : 0;
      if (two.length === 0) return one.length > 0 ? -1 : 0;
      return one.localeCompare(two);
    };

    const minHeap: BinaryHeap<string> = new BinaryHeap(lists, comparator);

    // Assertions
    // Assert minHeap has 10 nodes and they are in the correct order
    expect(minHeap).toBeDefined();
    expect(minHeap.length()).toEqual(10);
    expect(minHeap.heap()).toEqual([
      fifth,
      second,
      sixth,
      nineth,
      first,
      third,
      seventh,
      fourth,
      eighth,
      tenth
    ]);

    // Assert minHeap insertions are correct
    minHeap.insert(third);
    expect(minHeap.length()).toEqual(11);
    expect(minHeap.heap()).toEqual([
      fifth,
      second,
      sixth,
      nineth,
      first,
      third,
      seventh,
      fourth,
      eighth,
      tenth,
      third
    ]);

    minHeap.insert(fifth);
    expect(minHeap.length()).toEqual(12);
    expect(minHeap.heap()).toEqual([
      fifth,
      second,
      fifth,
      nineth,
      first,
      sixth,
      seventh,
      fourth,
      eighth,
      tenth,
      third,
      third
    ]);

    // Assert that data is removed in correct order
    const removedOne = minHeap.remove();
    expect(removedOne).toEqual(fifth);

    const removedTwo = minHeap.remove();
    expect(removedTwo).toEqual(fifth);

    const removedThree = minHeap.remove();
    expect(removedThree).toEqual(second);

    const removedFour = minHeap.remove();
    expect(removedFour).toEqual(nineth);

    const removedFive = minHeap.remove();
    expect(removedFive).toEqual(eighth);

    const removedSix = minHeap.remove();
    expect(removedSix).toEqual(sixth);

    const removedSeven = minHeap.remove();
    expect(removedSeven).toEqual(first);

    const removedEigth = minHeap.remove();
    expect(removedEigth).toEqual(fourth);

    const removedNine = minHeap.remove();
    expect(removedNine).toEqual(tenth);

    const removedTen = minHeap.remove();
    expect(removedTen).toEqual(seventh);

    const removedEleven = minHeap.remove();
    expect(removedEleven).toEqual(third);

    const removedTwelve = minHeap.remove();
    expect(removedTwelve).toEqual(third);
  });
});

describe("Max Binary Heap", () => {
  it("should be able to be created correctly, with proper insertion and removal of data", () => {
    // Setup
    const first = { data: [2, 4, 9, 10, 11, 12], label: "0" };
    const second = { data: [1, 8, 10, 22], label: "1" };

    const lists = [first, second];

    const comparator = (one: number[], two: number[]): number => {
      if (one.length === 0) return two[0] ? -1 : 0;
      if (two.length === 0) return one[0] ? 1 : 0;
      return one[0] - two[0];
    };

    const maxHeap: BinaryHeap<number[]> = new BinaryHeap(
      lists,
      comparator,
      "DESC"
    );

    // Assertions
    // Assert minHeap has two nodes and they are in the correct order
    expect(maxHeap).toBeDefined();
    expect(maxHeap.length()).toEqual(2);
    expect(maxHeap.heap()).toEqual([first, second]);

    // Assert that more nodes can be added and processed in proper order
    const third = { data: [-4, 0], label: "2" };

    maxHeap.insert(third);
    expect(maxHeap.length()).toEqual(3);
    expect(maxHeap.heap()).toEqual([first, second, third]);

    // Assert that empty data array IS valid as data is not falsey
    const fourth = { data: [] as number[], label: "3" };

    maxHeap.insert(fourth);
    expect(maxHeap.length()).toEqual(4);
    expect(maxHeap.heap()).toEqual([first, second, third, fourth]);

    // Assert that null data IS NOT valid as data is falsey
    const fifth = { data: null as number[], label: "4" };

    maxHeap.insert(fifth);
    expect(maxHeap.length()).toEqual(4);
    expect(maxHeap.heap()).toEqual([first, second, third, fourth]);

    // Assert that data is removed in correct order
    const removedOne = maxHeap.remove();
    expect(removedOne).toEqual(first);

    const removedTwo = maxHeap.remove();
    expect(removedTwo).toEqual(second);

    const removedThree = maxHeap.remove();
    expect(removedThree).toEqual(third);

    const removedFour = maxHeap.remove();
    expect(removedFour).toEqual(fourth);

    const removedFive = maxHeap.remove();
    expect(removedFive).toEqual(null);

    const removedSix = maxHeap.remove();
    expect(removedSix).toEqual(null);
  });

  it("should be able to be created with more than 2 nodes", () => {
    // Setup
    const first = { data: "r string", label: "0" };
    const second = { data: "b string ", label: "1" };
    const third = { data: "z string ", label: "2" };
    const fourth = { data: "s string ", label: "3" };
    const fifth = { data: "a string ", label: "4" };
    const sixth = { data: "k string ", label: "5" };
    const seventh = { data: "y string ", label: "6" };
    const eighth = { data: "i string ", label: "8" };
    const nineth = { data: "d string ", label: "9" };
    const tenth = { data: "t string ", label: "10" };

    const lists = [
      first,
      second,
      third,
      fourth,
      fifth,
      sixth,
      seventh,
      eighth,
      nineth,
      tenth
    ];

    const comparator = (one: string, two: string): number => {
      if (one.length === 0) return two.length > 0 ? 1 : 0;
      if (two.length === 0) return one.length > 0 ? -1 : 0;
      return one.localeCompare(two);
    };

    const maxHeap: BinaryHeap<string> = new BinaryHeap(
      lists,
      comparator,
      "DESC"
    );

    // Assertions
    // Assert maxHeap has 10 nodes and they are in the correct order
    expect(maxHeap).toBeDefined();
    expect(maxHeap.length()).toEqual(10);
    expect(maxHeap.heap()).toEqual([
      third,
      tenth,
      seventh,
      eighth,
      fourth,
      sixth,
      first,
      second,
      nineth,
      fifth
    ]);

    // Assert maxHeap insertions are correct
    maxHeap.insert(third);
    expect(maxHeap.length()).toEqual(11);
    expect(maxHeap.heap()).toEqual([
      third,
      third,
      seventh,
      eighth,
      tenth,
      sixth,
      first,
      second,
      nineth,
      fifth,
      fourth
    ]);

    maxHeap.insert(fifth);
    expect(maxHeap.length()).toEqual(12);
    expect(maxHeap.heap()).toEqual([
      third,
      third,
      seventh,
      eighth,
      tenth,
      sixth,
      first,
      second,
      nineth,
      fifth,
      fourth,
      fifth
    ]);

    // Assert that data is removed in correct order
    const removedOne = maxHeap.remove();
    expect(removedOne).toEqual(third);

    const removedTwo = maxHeap.remove();
    expect(removedTwo).toEqual(third);

    const removedThree = maxHeap.remove();
    expect(removedThree).toEqual(seventh);

    const removedFour = maxHeap.remove();
    expect(removedFour).toEqual(tenth);

    const removedFive = maxHeap.remove();
    expect(removedFive).toEqual(fourth);

    const removedSix = maxHeap.remove();
    expect(removedSix).toEqual(first);

    const removedSeven = maxHeap.remove();
    expect(removedSeven).toEqual(sixth);

    const removedEigth = maxHeap.remove();
    expect(removedEigth).toEqual(eighth);

    const removedNine = maxHeap.remove();
    expect(removedNine).toEqual(nineth);

    const removedTen = maxHeap.remove();
    expect(removedTen).toEqual(second);

    const removedEleven = maxHeap.remove();
    expect(removedEleven).toEqual(fifth);

    const removedTwelve = maxHeap.remove();
    expect(removedTwelve).toEqual(fifth);
  });
});
