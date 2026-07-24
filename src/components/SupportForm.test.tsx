import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SupportForm from "./SupportForm";


describe("SupportForm", () => {
    it("shows field validation errors on submit when empty", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<SupportForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", { name: /send/i }));

        expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter your email/i)).toBeInTheDocument();
        expect(screen.getByText(/please describe your issue/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("accepts a valid attachment and submits", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue({ success: true });

        render(<SupportForm onSubmit={onSubmit} maxAttachmentBytes={1024 * 1024} acceptedAttachmentTypes={[".pdf"]} />);

        await user.type(screen.getByLabelText(/your name/i), "Jane Doe");
        await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
        await user.type(screen.getByLabelText(/how can we help/i), "Need help with my account. It is not working.");

        const file = new File(["%PDF"], "test.pdf", { type: "application/pdf" });
        const input = screen.getByLabelText(/attachment/i).querySelector("input[type='file']") as HTMLInputElement | null;
        expect(input).toBeTruthy();
        if (!input) throw new Error("Expected attachment file input");

        await user.upload(input, file);

        expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /send/i }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        const submitted = onSubmit.mock.calls[0][0];
        expect(submitted.name).toBe("Jane Doe");
        expect(submitted.email).toBe("jane@example.com");
        expect(submitted.attachment).toBeInstanceOf(File);
        expect(submitted.attachment?.name).toBe("test.pdf");
    });

    it("rejects an attachment that exceeds size limit", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<SupportForm onSubmit={onSubmit} maxAttachmentBytes={10 * 1024} acceptedAttachmentTypes={[".pdf"]} />);

        const file = new File([new Uint8Array(20 * 1024)], "big.pdf", { type: "application/pdf" });

        const input = screen.getByLabelText(/attachment/i).querySelector("input[type='file']") as HTMLInputElement | null;
        expect(input).toBeTruthy();
        if (!input) throw new Error("Expected attachment file input");

        await user.upload(input, file);

        expect(
            screen.getByText(/attachment must be/i),
        ).toBeInTheDocument();

        // Fill required fields and ensure submit is blocked by attachment validation.
        await user.type(screen.getByLabelText(/your name/i), "Jane Doe");
        await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
        await user.type(screen.getByLabelText(/how can we help/i), "Need help with my account. This is broken.");

        await user.click(screen.getByRole("button", { name: /send/i }));
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

