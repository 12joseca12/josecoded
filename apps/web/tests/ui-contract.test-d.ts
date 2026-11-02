import { describe, expectTypeOf, it } from 'vitest';

import type { ArrowLinkProps } from '@/components/ui/arrow-link';
import type { ButtonProps } from '@/components/ui/button';
import type { IconTile } from '@/components/ui/icon-tile';
import type { Surface } from '@/components/ui/surface';
import type { TwoToneHeading } from '@/components/ui/two-tone-heading';
import type {
  ArrowLinkEmphasis,
  ButtonSize,
  ButtonVariant,
  IconTileSize,
  IconTileTone,
  SurfaceLayer,
  SurfaceRadius,
  TwoToneHeadingLevel,
  TwoToneHeadingSize,
} from '@josecoded/types';
import type { ComponentProps } from 'react';

// Contract of working-agreements §15: variants are unions in @josecoded/types and a link and a
// button never mix their props. These are compile-time assertions: a wrong use is a type error,
// and `@ts-expect-error` turns that error into the test (it fails if the code stops erroring).

describe('variant unions', () => {
  it('are exactly the values of the design', () => {
    expectTypeOf<ButtonVariant>().toEqualTypeOf<'solid' | 'ghost' | 'quiet' | 'danger'>();
    expectTypeOf<ButtonSize>().toEqualTypeOf<'sm' | 'md' | 'lg'>();
    expectTypeOf<IconTileSize>().toEqualTypeOf<'sm' | 'md'>();
    expectTypeOf<IconTileTone>().toEqualTypeOf<'soft' | 'solid'>();
    expectTypeOf<SurfaceRadius>().toEqualTypeOf<'cell' | 'tcard'>();
    expectTypeOf<SurfaceLayer>().toEqualTypeOf<'card' | 'overlay'>();
    expectTypeOf<ArrowLinkEmphasis>().toEqualTypeOf<'regular' | 'strong'>();
    expectTypeOf<TwoToneHeadingLevel>().toEqualTypeOf<'h1' | 'h2'>();
    expectTypeOf<TwoToneHeadingSize>().toEqualTypeOf<'headline' | 'display-closing' | 'crm'>();
  });
});

describe('primitives reject what the contract forbids', () => {
  it('Button', () => {
    // @ts-expect-error `primary` is not a variant (the names are solid, ghost and quiet)
    const wrongVariant: ButtonProps = { variant: 'primary' };
    // @ts-expect-error a link takes no onClick
    const linkWithClick: ButtonProps = { href: '/proyectos', onClick: () => undefined };
    // @ts-expect-error a link cannot be disabled
    const disabledLink: ButtonProps = { href: '/proyectos', disabled: true };
    // @ts-expect-error an icon-only button needs its aria-label
    const unnamedIcon: ButtonProps = { iconOnly: true, icon: 'search' };
    // @ts-expect-error href must be a path of the site or an absolute URL
    const relativeHref: ButtonProps = { href: 'proyectos' };
    // @ts-expect-error className is not part of the API: styles belong to the primitive
    const withClass: ButtonProps = { className: 'x' };

    const link: ButtonProps = { href: '/proyectos' };
    const action: ButtonProps = { onClick: () => undefined, disabled: true };
    const iconOnly: ButtonProps = { iconOnly: true, icon: 'search', 'aria-label': 'Buscar' };
    expectTypeOf([link, action, iconOnly]).not.toBeAny();
    expectTypeOf([wrongVariant, linkWithClick, disabledLink, unnamedIcon, relativeHref, withClass]).not.toBeAny();
  });

  it('ArrowLink, IconTile, Surface and TwoToneHeading', () => {
    // @ts-expect-error a link takes no onClick
    const linkWithClick: ArrowLinkProps = { href: '/lab', onClick: () => undefined };
    // @ts-expect-error `bold` is not an emphasis
    const bold: ArrowLinkProps = { emphasis: 'bold', href: '/lab' };
    // @ts-expect-error the icon must be one of the registered Lucide names
    const unknownIcon: ComponentProps<typeof IconTile> = { icon: 'unicorn' };
    // @ts-expect-error `huge` is not a radius
    const hugeRadius: ComponentProps<typeof Surface> = { radius: 'huge' };
    // @ts-expect-error `h3` is not a level of the two-tone heading
    const h3: ComponentProps<typeof TwoToneHeading> = { lead: 'a', tail: 'b', level: 'h3' };
    expectTypeOf([linkWithClick, bold]).not.toBeAny();
    expectTypeOf([unknownIcon, hugeRadius, h3]).not.toBeAny();
  });
});
