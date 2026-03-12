import { describe, expect, it, beforeAll, afterAll, afterEach, jest } from "@jest/globals";

import debounce from "../debounce";

describe("utils/debounce", () => {
  const mockFn = jest.fn();

  function setupDebouncedFn(fn = mockFn, delay = 1000) {
    return debounce(fn, delay);
  }

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    mockFn.mockClear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("debouncedFn", () => {
    it("should delay function execution by the specified delay", () => {
      const { debouncedFn } = setupDebouncedFn();

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalled();
    });

    it("should reset the timer when called multiple times before delay expires", () => {
      const { debouncedFn } = setupDebouncedFn();

      debouncedFn();
      jest.advanceTimersByTime(500);

      debouncedFn();
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalled();
    });

    it("should execute with the most recent arguments after multiple calls", () => {
      const { debouncedFn } = setupDebouncedFn();

      debouncedFn("first");
      jest.advanceTimersByTime(500);

      debouncedFn("second");
      jest.advanceTimersByTime(500);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledWith("second");
    });

    it("should execute only once when called multiple times within the delay period", () => {
      const { debouncedFn } = setupDebouncedFn();

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("forcedFn", () => {
    it("should execute the function immediately without waiting for delay", () => {
      const { forcedFn } = setupDebouncedFn();

      forcedFn();
      expect(mockFn).toHaveBeenCalled();
    });

    it("should clear any pending debounced calls", () => {
      const { debouncedFn, forcedFn } = setupDebouncedFn();

      debouncedFn();
      forcedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should return the function's return value", () => {
      const returnValue = "test return";
      const mockFnWithReturn = jest.fn(() => returnValue);
      const { forcedFn } = setupDebouncedFn(mockFnWithReturn);
      const result = forcedFn();
      expect(result).toBe(returnValue);
    });
  });

  describe("clear", () => {
    it("should cancel pending debounced function execution", () => {
      const { debouncedFn, clear } = setupDebouncedFn();

      debouncedFn();
      clear();

      jest.advanceTimersByTime(1000);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("should do nothing if no execution is pending, and should not affect future calls", () => {
      const { clear, debouncedFn } = setupDebouncedFn();

      clear();
      expect(mockFn).not.toHaveBeenCalled();

      debouncedFn();
      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle multiple debounced functions independently", () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();
      const { debouncedFn: debouncedFn1, forcedFn: forcedFn1 } = setupDebouncedFn(mockFn1);
      const { debouncedFn: debouncedFn2, clear: clear2 } = setupDebouncedFn(mockFn2);

      debouncedFn1();
      debouncedFn2();

      jest.advanceTimersByTime(1000);
      expect(mockFn1).toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalled();

      debouncedFn1();
      debouncedFn2();

      forcedFn1();
      clear2();
      jest.advanceTimersByTime(500);
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });

    it("should work correctly with zero delay", () => {
      const { debouncedFn } = setupDebouncedFn(mockFn, 0);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
