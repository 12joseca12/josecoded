import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Bento, BentoCell } from '..';

it('composes three cells whose spans sum 12 per row', () => {
  const { container } = render(
    <Bento>
      <BentoCell span={7} tall title="a">
        a
      </BentoCell>
      <BentoCell span={5} title="b">
        b
      </BentoCell>
      <BentoCell span={5} title="c">
        c
      </BentoCell>
    </Bento>,
  );
  const cells = [...container.querySelectorAll('[data-span]')];
  expect(cells).toHaveLength(3);
  // 7 (tall, two rows) + 5 / 7 + 5 = 12 per row
  expect(cells.map((c) => Number((c as HTMLElement).dataset.span))).toEqual([7, 5, 5]);
});

it('names each cell by its heading and has no axe violations', async () => {
  const { container, getByRole } = render(
    <Bento>
      <BentoCell id="one" span={6} icon="user" title="Sobre mí" note="nota">
        cuerpo
      </BentoCell>
    </Bento>,
  );
  expect(getByRole('article', { name: 'Sobre mí' })).toBeTruthy();
  expect(await axe(container)).toHaveNoViolations();
});

it('only an expandable cell carries the ⤢ control and takes focus', () => {
  const plain = render(
    <Bento>
      <BentoCell id="p" title="p">
        x
      </BentoCell>
    </Bento>,
  );
  expect(plain.container.querySelector('button')).toBeNull();
  expect(plain.container.querySelector('article')?.hasAttribute('tabindex')).toBe(false);
});
