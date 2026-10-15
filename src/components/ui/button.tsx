import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Button primitive, maintained locally with project design tokens.
const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300 disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { default: "bg-teal-300 px-4 py-2.5 text-slate-950 hover:bg-teal-200", outline: "border border-slate-700 px-4 py-2.5 text-slate-200 hover:bg-slate-800" } },
  defaultVariants: { variant: "default" }
});
export function Button({ className, variant, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, className }))} {...props} />;
}
