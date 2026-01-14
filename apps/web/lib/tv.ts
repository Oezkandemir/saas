/**
 * tv (tailwind-variants) Utility
 *
 * Similar to class-variance-authority but optimized for component variants
 * Used for creating component variants with Tailwind classes
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type Variants = Record<string, Record<string, ClassValue>>;
type DefaultVariants = Record<string, string>;

type CompoundVariant = {
  [key: string]: string | string[];
} & {
  class: ClassValue;
};

interface TVOptions {
  variants?: Variants;
  defaultVariants?: DefaultVariants;
  compoundVariants?: Array<CompoundVariant>;
}

export function tv(base: ClassValue, options?: TVOptions) {
  return (props?: Record<string, any> & { className?: ClassValue }) => {
    const {
      variants = {},
      defaultVariants = {},
      compoundVariants = [],
    } = options || {};
    const { className, ...rest } = props || {};

    // Get variant classes
    const variantClasses: ClassValue[] = [];

    for (const [key, variantMap] of Object.entries(variants)) {
      const value = rest[key] || defaultVariants[key];
      if (value && variantMap[value]) {
        variantClasses.push(variantMap[value]);
      }
    }

    // Apply compound variants
    for (const compound of compoundVariants) {
      const { class: compoundClass, ...compoundProps } = compound;
      const matches = Object.entries(compoundProps).every(([key, values]) => {
        const propValue = rest[key] || defaultVariants[key];
        return Array.isArray(values)
          ? values.includes(propValue)
          : propValue === values;
      });

      if (matches) {
        variantClasses.push(compoundClass);
      }
    }

    return twMerge(clsx(base, variantClasses, className));
  };
}
