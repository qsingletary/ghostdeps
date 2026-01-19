import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchInput from "./search-input";

describe("SearchInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
  };

  describe("rendering", () => {
    it("should render input element", () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with default placeholder", () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByPlaceholderText("Search packages...")).toBeInTheDocument();
    });

    it("should render with custom placeholder", () => {
      render(
        <SearchInput {...defaultProps} placeholder="Find a package..." />,
      );

      expect(screen.getByPlaceholderText("Find a package...")).toBeInTheDocument();
    });

    it("should display the value", () => {
      render(<SearchInput {...defaultProps} value="lodash" />);

      expect(screen.getByRole("textbox")).toHaveValue("lodash");
    });

    it("should render search icon", () => {
      const { container } = render(<SearchInput {...defaultProps} />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("onChange", () => {
    it("should call onChange when input value changes", async () => {
      const onChange = vi.fn();
      render(<SearchInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "react" } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("react");
    });
  });

  describe("onSubmit", () => {
    it("should call onSubmit when Enter is pressed with non-empty value", () => {
      const onSubmit = vi.fn();
      render(<SearchInput {...defaultProps} value="lodash" onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("lodash");
    });

    it("should not call onSubmit when Enter is pressed with empty value", () => {
      const onSubmit = vi.fn();
      render(<SearchInput {...defaultProps} value="" onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should not call onSubmit when Enter is pressed with whitespace-only value", () => {
      const onSubmit = vi.fn();
      render(<SearchInput {...defaultProps} value="   " onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should trim whitespace when submitting", () => {
      const onSubmit = vi.fn();
      render(<SearchInput {...defaultProps} value="  lodash  " onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("lodash");
    });

    it("should not call onSubmit for other keys", () => {
      const onSubmit = vi.fn();
      render(<SearchInput {...defaultProps} value="lodash" onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Tab" });
      fireEvent.keyDown(input, { key: "Escape" });
      fireEvent.keyDown(input, { key: "a" });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("should show spinner when isLoading is true", () => {
      const { container } = render(
        <SearchInput {...defaultProps} isLoading={true} />,
      );

      // Spinner has animate-spin class
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should not show spinner when isLoading is false", () => {
      const { container } = render(
        <SearchInput {...defaultProps} isLoading={false} />,
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should show Enter kbd hint when not loading", () => {
      render(<SearchInput {...defaultProps} isLoading={false} />);

      expect(screen.getByText("Enter")).toBeInTheDocument();
    });
  });
});
