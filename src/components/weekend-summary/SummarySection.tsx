"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { summarySectionVariants } from "./motion";

type Props = {
  children: ReactNode;
  className?: string;
};

function SummarySectionComponent({ children, className = "" }: Props) {
  return (
    <motion.div
      variants={summarySectionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const SummarySection = memo(SummarySectionComponent);
