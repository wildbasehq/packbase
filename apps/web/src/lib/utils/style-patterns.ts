import { cn } from './cn';
import { ClassValue } from 'clsx';

/**
 * Utility for creating conditional class patterns
 * @param baseClasses - Base classes that are always applied
 * @param conditionalClasses - Object with condition keys and class values
 * @param additionalClasses - Additional classes to be merged
 * @returns Combined class string
 */
export function conditionalClasses(
  baseClasses: ClassValue,
  conditionalClasses: Record<string, boolean>,
  additionalClasses?: ClassValue
): string {
  const classes = [baseClasses];
  
  // Add conditional classes
  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className);
    }
  });
  
  // Add additional classes if provided
  if (additionalClasses) {
    classes.push(additionalClasses);
  }
  
  return cn(...classes);
}

/**
 * Utility for creating responsive class patterns
 * @param defaultClasses - Default classes for all screen sizes
 * @param responsiveClasses - Object with breakpoint keys and class values
 * @param additionalClasses - Additional classes to be merged
 * @returns Combined class string
 */
export function responsiveClasses(
  defaultClasses: ClassValue,
  responsiveClasses: {
    sm?: ClassValue;
    md?: ClassValue;
    lg?: ClassValue;
    xl?: ClassValue;
    '2xl'?: ClassValue;
  },
  additionalClasses?: ClassValue
): string {
  const classes = [defaultClasses];
  
  // Add responsive classes with proper prefixes
  if (responsiveClasses.sm) classes.push(`sm:${responsiveClasses.sm}`);
  if (responsiveClasses.md) classes.push(`md:${responsiveClasses.md}`);
  if (responsiveClasses.lg) classes.push(`lg:${responsiveClasses.lg}`);
  if (responsiveClasses.xl) classes.push(`xl:${responsiveClasses.xl}`);
  if (responsiveClasses['2xl']) classes.push(`2xl:${responsiveClasses['2xl']}`);
  
  // Add additional classes if provided
  if (additionalClasses) {
    classes.push(additionalClasses);
  }
  
  return cn(...classes);
}

/**
 * Utility for creating variant-based class patterns
 * @param variants - Object with variant options
 * @param selectedVariant - The selected variant
 * @param defaultVariant - The default variant if none selected
 * @param additionalClasses - Additional classes to be merged
 * @returns Combined class string
 */
export function variantClasses<T extends string>(
  variants: Record<T, ClassValue>,
  selectedVariant: T | undefined,
  defaultVariant: T,
  additionalClasses?: ClassValue
): string {
  const variantClass = selectedVariant ? variants[selectedVariant] : variants[defaultVariant];
  
  return additionalClasses ? cn(variantClass, additionalClasses) : cn(variantClass);
}

/**
 * Utility for creating state-based class patterns
 * @param states - Object with state options and their classes
 * @param currentState - The current state
 * @param baseClasses - Base classes that are always applied
 * @param additionalClasses - Additional classes to be merged
 * @returns Combined class string
 */
export function stateClasses<T extends string>(
  states: Record<T, ClassValue>,
  currentState: T,
  baseClasses?: ClassValue,
  additionalClasses?: ClassValue
): string {
  const classes = [];
  
  if (baseClasses) classes.push(baseClasses);
  classes.push(states[currentState]);
  if (additionalClasses) classes.push(additionalClasses);
  
  return cn(...classes);
}