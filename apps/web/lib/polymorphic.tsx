/**
 * AlignUI - Polymorphic Utility
 *
 * Creates polymorphic components that can render as different HTML elements
 * while maintaining type safety
 */

import * as React from "react";

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {},
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props = {},
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

export type PolymorphicComponent<
  DefaultElement extends React.ElementType,
  Props = {},
> = <C extends React.ElementType = DefaultElement>(
  props: PolymorphicComponentPropWithRef<C, Props>,
) => React.ReactElement | null;

export function createPolymorphicComponent<
  DefaultElement extends React.ElementType,
  Props = {},
>(
  component: React.ForwardRefExoticComponent<
    PolymorphicComponentPropWithRef<DefaultElement, Props>
  >,
): PolymorphicComponent<DefaultElement, Props> {
  return component as PolymorphicComponent<DefaultElement, Props>;
}



