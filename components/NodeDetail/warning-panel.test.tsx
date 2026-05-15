import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WarningPanel from "./warning-panel";
import type { SupplyChainWarning } from "@/modules/packages";

const warning = (overrides: Partial<SupplyChainWarning> = {}): SupplyChainWarning => ({
  kind: "typosquat",
  severity: "high",
  message: "Looks like react",
  ...overrides,
});

describe("WarningPanel", () => {
  it("renders nothing when there are no warnings", () => {
    const { container } = render(<WarningPanel warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays the total warning count in the header", () => {
    render(
      <WarningPanel
        warnings={[
          warning({ kind: "typosquat" }),
          warning({ kind: "new-popularity", severity: "moderate" }),
        ]}
      />,
    );

    expect(screen.getByText(/Supply-chain \(2\)/)).toBeInTheDocument();
  });

  it("renders the warning message, severity, and kind label", () => {
    render(
      <WarningPanel
        warnings={[
          warning({
            kind: "typosquat",
            severity: "high",
            message: "Suspiciously close to 'react'",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Suspiciously close to 'react'")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Typosquat")).toBeInTheDocument();
  });

  it("renders the right label for each warning kind", () => {
    render(
      <WarningPanel
        warnings={[
          warning({ kind: "new-popularity", severity: "moderate" }),
          warning({ kind: "single-maintainer-new", severity: "low" }),
        ]}
      />,
    );

    expect(screen.getByText("Sudden traction")).toBeInTheDocument();
    expect(screen.getByText("Solo + new")).toBeInTheDocument();
  });

  it("sorts warnings by severity (high first)", () => {
    render(
      <WarningPanel
        warnings={[
          warning({ severity: "low", kind: "single-maintainer-new" }),
          warning({ severity: "high", kind: "typosquat" }),
          warning({ severity: "moderate", kind: "new-popularity" }),
        ]}
      />,
    );

    const severityLabels = screen
      .getAllByText(/high|moderate|low/i)
      .map((el) => el.textContent);
    expect(severityLabels[0]).toBe("high");
    expect(severityLabels[1]).toBe("moderate");
    expect(severityLabels[2]).toBe("low");
  });
});
