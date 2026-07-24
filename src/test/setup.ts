import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

// Expose testing library helpers globally so test files that use the compact
// `/// <reference types="vitest" />import ...` syntax (where the reference
// directive is on the same line as an import, effectively silencing the import)
// still have access to render, screen, etc.
(globalThis as Record<string, unknown>).render = render;
(globalThis as Record<string, unknown>).screen = screen;
(globalThis as Record<string, unknown>).waitFor = waitFor;
(globalThis as Record<string, unknown>).fireEvent = fireEvent;
(globalThis as Record<string, unknown>).act = act;

