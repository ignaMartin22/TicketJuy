"use client";

import { useEffect, useId, useRef } from "react";
import { buttonClass } from "./ui";

/** Confirmación modal. Se muestra mientras `open` sea true. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-linea bg-noche-2 p-0 text-luz backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-tenue">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={buttonClass.secondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={buttonClass.danger}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
