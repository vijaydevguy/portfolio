import React from "react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

/**
 * Reusable Confirmation Dialog Component (DRY Principle)
 * Used for actions like Logout, Delete User, Discard Changes, etc.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-5">
        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary !text-xs !py-2.5 !px-4 !rounded-xl"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={
              isDestructive
                ? "btn-danger !text-xs !py-2.5 !px-4 !rounded-xl font-semibold !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 !text-white !border-transparent shadow-xs"
                : "btn-primary !text-xs !py-2.5 !px-4 !rounded-xl font-semibold"
            }
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
