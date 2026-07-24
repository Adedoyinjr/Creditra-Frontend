import { useId, useMemo, useState } from "react";
import type React from "react";

import { FileText, Paperclip, Send, X } from "lucide-react";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";
import "./SupportForm.css";

export type SupportFormValues = {
    name: string;
    email: string;
    message: string;
    attachment?: File;
};

export type SupportFormSubmitResult =
    | void
    | {
        success?: boolean;
        error?: string;
    };

export type SupportFormProps = {
    onSubmit: (values: SupportFormValues) => Promise<SupportFormSubmitResult> | SupportFormSubmitResult;
    /**
     * Optional security constraints for file attachments.
     * Defaults are conservative for UX + safety.
     */
    maxAttachmentBytes?: number;
    acceptedAttachmentTypes?: string[]; // e.g. [".png", ".pdf"]
};

function bytesToMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(1);
}

function getExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) return "";
    return fileName.slice(dotIndex).toLowerCase();
}

export default function SupportForm({
    onSubmit,
    maxAttachmentBytes = 5 * 1024 * 1024,
    acceptedAttachmentTypes = [".png", ".jpg", ".jpeg", ".pdf"],
}: SupportFormProps) {
    const id = useId();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const [attachment, setAttachment] = useState<File | undefined>(undefined);
    const [attachmentError, setAttachmentError] = useState<string>("");

    const [formError, setFormError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const acceptAttr = useMemo(() => acceptedAttachmentTypes.join(","), [acceptedAttachmentTypes]);

    const validateEmail = (value: string) => {
        // Simple, pragmatic validation for client-side UX.
        // Server should do final validation.
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    };

    const errors = useMemo(() => {
        const next: {
            name?: string;
            email?: string;
            message?: string;
        } = {};

        if (!name.trim()) next.name = "Please enter your name.";
        if (!email.trim()) next.email = "Please enter your email.";
        else if (!validateEmail(email)) next.email = "Enter a valid email address.";

        if (!message.trim()) next.message = "Please describe your issue.";
        else if (message.trim().length < 10) next.message = "Message must be at least 10 characters.";
        else if (message.trim().length > 2000) next.message = "Message must be 2000 characters or less.";

        return next;
    }, [email, message, name]);

    const hasFieldErrors = Boolean(errors.name || errors.email || errors.message);

    const validateAttachment = (file: File | undefined) => {
        if (!file) {
            setAttachmentError("");
            return true;
        }

        const ext = getExtension(file.name);
        if (!acceptedAttachmentTypes.includes(ext)) {
            const allowed = acceptedAttachmentTypes.join(", ");
            setAttachmentError(`Unsupported file type. Allowed: ${allowed}`);
            return false;
        }

        if (file.size > maxAttachmentBytes) {
            setAttachmentError(`Attachment must be ${bytesToMB(maxAttachmentBytes)} MB or less.`);
            return false;
        }

        setAttachmentError("");
        return true;
    };

    const onPickFile = (file: File | undefined) => {
        setAttachment(file);
        validateAttachment(file);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError("");
        setSubmitSuccess(false);

        if (!validateAttachment(attachment)) {
            return;
        }

        if (hasFieldErrors) {
            // Triggering per-field aria-invalid by rendering FormField with errors.
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await onSubmit({ name: name.trim(), email: email.trim(), message: message.trim(), attachment });
            const success = typeof result === "object" && result ? result.success !== false : true;
            const error = typeof result === "object" && result ? result.error : undefined;

            if (!success || error) {
                setFormError(error || "Could not send your request. Please try again.");
                return;
            }

            setSubmitSuccess(true);
            setName("");
            setEmail("");
            setMessage("");
            setAttachment(undefined);
            setAttachmentError("");
        } catch (e: any) {
            setFormError(e?.message || "Could not send your request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const attachmentLabelId = `${id}-attachment-label`;

    return (
        <form className="support-form" onSubmit={handleSubmit} aria-label="Support form">
            <div className="support-form__grid">
                <FormField
                    id={`${id}-name`}
                    label="Your name"
                    required
                    error={errors.name}
                    inputProps={{
                        value: name,
                        onChange: (e) => setName(e.target.value),
                        placeholder: "Jane Doe",
                        autoComplete: "name",
                    }}
                />

                <FormField
                    id={`${id}-email`}
                    label="Email address"
                    required
                    type="email"
                    error={errors.email}
                    inputProps={{
                        value: email,
                        onChange: (e) => setEmail(e.target.value),
                        placeholder: "jane@company.com",
                        autoComplete: "email",
                        inputMode: "email",
                    }}
                />

                <div className="support-form__full">
                    <FormField
                        as="textarea"
                        id={`${id}-message`}
                        label="How can we help?"
                        required
                        helpText="Include any details that would help us troubleshoot."
                        error={errors.message}
                        inputProps={{
                            value: message,
                            onChange: (e) => setMessage(e.target.value),
                            placeholder: "Tell us what happened…",
                            rows: 5,
                            maxLength: 2000,
                        }}
                    />
                </div>

                <div className="support-form__full">
                    <div className="support-form__attachment">
                        <label id={attachmentLabelId} className="support-form__attachment-label">
                            <Paperclip size={16} aria-hidden="true" />
                            <span>Attachment (optional)</span>
                            <span className="support-form__attachment-sub">Up to {bytesToMB(maxAttachmentBytes)} MB. {acceptedAttachmentTypes.join(", ")}</span>
                        </label>

                        <div className="support-form__attachment-controls">
                            <input
                                className="support-form__attachment-input"
                                type="file"
                                id={`${id}-attachment`}
                                name="attachment"
                                aria-labelledby={attachmentLabelId}
                                accept={acceptAttr}
                                onChange={(e) => onPickFile(e.target.files?.[0])}
                            />

                            {attachment ? (
                                <div className="support-form__attachment-chip" role="group" aria-label="Selected attachment">
                                    <FileText size={16} aria-hidden="true" />
                                    <span className="support-form__attachment-name" title={attachment.name}>
                                        {attachment.name}
                                    </span>
                                    <button
                                        className="support-form__attachment-remove"
                                        type="button"
                                        onClick={() => onPickFile(undefined)}
                                        aria-label="Remove attachment"
                                    >
                                        <X size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <div className="support-form__attachment-empty" aria-hidden="true">
                                    No file selected
                                </div>
                            )}
                        </div>

                        {attachmentError ? (
                            <FormMessage id={`${id}-attachment-error`} title={attachmentError} tone="inline" type="danger" reserveSpace={false} />
                        ) : null}
                    </div>
                </div>

                {formError ? (
                    <div className="support-form__full">
                        <FormMessage id={`${id}-form-error`} title={formError} tone="alert" type="danger" reserveSpace={false} />
                    </div>
                ) : null}

                {submitSuccess ? (
                    <div className="support-form__full">
                        <FormMessage title="Request sent" message="We’ll get back to you by email." tone="alert" type="success" reserveSpace={false} />
                    </div>
                ) : null}

                <div className="support-form__actions">
                    <button
                        className="support-form__submit"
                        type="submit"
                        disabled={isSubmitting}
                        aria-disabled={isSubmitting}
                    >
                        <Send size={16} aria-hidden="true" />
                        <span>{isSubmitting ? "Sending…" : "Send"}</span>
                    </button>

                    <p className="support-form__privacy">
                        We only use your message to respond to your request.
                    </p>
                </div>
            </div>
        </form>
    );
}

