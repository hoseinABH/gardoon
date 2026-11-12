"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "./IconButton";
import { X } from "./Icons";
import { Typography } from "./Typography";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
            className="w-full max-w-shell rounded-t-hero border-t border-white/12 bg-card px-5 pt-3 pb-7 shadow-2xl max-h-sheet overflow-y-auto"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <Typography variant="title-md" as="h3">
                {title}
              </Typography>
              <IconButton
                size="sm"
                variant="tonal"
                onClick={onClose}
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
