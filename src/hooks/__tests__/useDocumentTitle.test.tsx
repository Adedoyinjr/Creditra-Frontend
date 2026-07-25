// src/hooks/__tests__/useDocumentTitle.test.tsx

import React from "react";
import { render } from "@testing-library/react";
import { useDocumentTitle } from "../useDocumentTitle";

function TestComponent({ title, description }: { title: string; description?: string }) {
  useDocumentTitle(title, description);
  return null;
}

test("sets document.title correctly", () => {
  render(<TestComponent title="My Page Title" />);
  expect(document.title).toBe("My Page Title");
});

test("creates/updates meta description when provided", () => {
  render(<TestComponent title="My Page" description="My description" />);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  expect(meta).not.toBeNull();
  expect(meta?.content).toBe("My description");
});
