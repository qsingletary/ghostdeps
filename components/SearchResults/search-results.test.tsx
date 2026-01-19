import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchResults from "./search-results";
import type { PackageSearchResult } from "@/modules/packages";

describe("SearchResults", () => {
  const mockResults: PackageSearchResult[] = [
    { name: "lodash", version: "4.17.21", description: "Lodash utilities", score: 0.95 },
    { name: "lodash-es", version: "4.17.21", description: "ES module version", score: 0.85 },
    { name: "lodash.debounce", version: "4.0.8", description: "", score: 0.75 },
  ];

  const defaultProps = {
    results: mockResults,
    onSelect: vi.fn(),
    visible: true,
  };

  describe("visibility", () => {
    it("should render when visible and has results", () => {
      render(<SearchResults {...defaultProps} />);

      expect(screen.getByText("lodash")).toBeInTheDocument();
    });

    it("should not render when visible is false", () => {
      const { container } = render(
        <SearchResults {...defaultProps} visible={false} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when results are empty", () => {
      const { container } = render(
        <SearchResults {...defaultProps} results={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when both conditions fail", () => {
      const { container } = render(
        <SearchResults {...defaultProps} visible={false} results={[]} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("result display", () => {
    it("should display all results", () => {
      render(<SearchResults {...defaultProps} />);

      expect(screen.getByText("lodash")).toBeInTheDocument();
      expect(screen.getByText("lodash-es")).toBeInTheDocument();
      expect(screen.getByText("lodash.debounce")).toBeInTheDocument();
    });

    it("should display package versions", () => {
      render(<SearchResults {...defaultProps} />);

      const versions = screen.getAllByText("4.17.21");
      expect(versions).toHaveLength(2);
    });

    it("should display package descriptions", () => {
      render(<SearchResults {...defaultProps} />);

      expect(screen.getByText("Lodash utilities")).toBeInTheDocument();
      expect(screen.getByText("ES module version")).toBeInTheDocument();
    });

    it("should handle packages without descriptions", () => {
      render(<SearchResults {...defaultProps} />);

      // lodash.debounce has no description - should still render
      expect(screen.getByText("lodash.debounce")).toBeInTheDocument();
    });
  });

  describe("onSelect", () => {
    it("should call onSelect with package name when clicked", () => {
      const onSelect = vi.fn();
      render(<SearchResults {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByText("lodash"));

      expect(onSelect).toHaveBeenCalledWith("lodash");
    });

    it("should call onSelect with correct name for each result", () => {
      const onSelect = vi.fn();
      render(<SearchResults {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByText("lodash-es"));
      expect(onSelect).toHaveBeenCalledWith("lodash-es");

      fireEvent.click(screen.getByText("lodash.debounce"));
      expect(onSelect).toHaveBeenCalledWith("lodash.debounce");
    });
  });

  describe("rendering elements", () => {
    it("should render buttons for each result", () => {
      render(<SearchResults {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
    });

    it("should render package icons", () => {
      const { container } = render(<SearchResults {...defaultProps} />);

      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("single result", () => {
    it("should render single result correctly", () => {
      render(
        <SearchResults
          results={[mockResults[0]!]}
          onSelect={defaultProps.onSelect}
          visible={true}
        />,
      );

      expect(screen.getByText("lodash")).toBeInTheDocument();
      expect(screen.getByText("4.17.21")).toBeInTheDocument();
      expect(screen.getByText("Lodash utilities")).toBeInTheDocument();
    });
  });
});
