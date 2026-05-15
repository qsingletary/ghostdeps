import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ViewToggle from "./view-toggle";

describe("ViewToggle", () => {
  it("renders both Tree and Graph buttons", () => {
    render(<ViewToggle value="tree" onChange={() => {}} />);
    expect(screen.getByText("Tree")).toBeInTheDocument();
    expect(screen.getByText("Graph")).toBeInTheDocument();
  });

  it("marks the active button with aria-pressed", () => {
    render(<ViewToggle value="graph" onChange={() => {}} />);
    expect(screen.getByText("Tree").closest("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("Graph").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("invokes onChange with the clicked mode", () => {
    const onChange = vi.fn();
    render(<ViewToggle value="tree" onChange={onChange} />);

    fireEvent.click(screen.getByText("Graph"));
    expect(onChange).toHaveBeenCalledWith("graph");

    fireEvent.click(screen.getByText("Tree"));
    expect(onChange).toHaveBeenCalledWith("tree");
  });
});
