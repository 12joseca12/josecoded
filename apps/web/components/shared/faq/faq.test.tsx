import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Faq, realFaq } from '.';

const items = [
  { id: 'a', question: '¿Cuánto tarda?', answer: 'Una semana.\n\nDepende del alcance.' },
  { id: 'b', question: '¿Firmas NDA?', answer: '{{DATO: respuesta de Jose}}' },
  { id: 'c', question: '{{DATO: pregunta}}', answer: 'Sí.' },
];

function graphOf(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.textContent ?? '{}') : undefined;
}

describe('Faq', () => {
  it('renders one <details> per question and describes exactly the real ones in FAQPage', () => {
    const { container } = render(<Faq items={items} />);
    const real = realFaq(items);
    expect(real.map((item) => item.id)).toEqual(['a']);
    const graph = graphOf(container);
    const page = graph['@graph'][0];
    expect(page['@type']).toBe('FAQPage');
    expect(page.mainEntity).toHaveLength(1);
    expect(page.mainEntity[0].name).toBe('¿Cuánto tarda?');
    expect(page.mainEntity[0].acceptedAnswer.text).toContain('Una semana.');
    // the visible questions include every real one
    expect(screen.getByText('¿Cuánto tarda?').closest('details')).not.toBeNull();
  });

  it('splits an answer into paragraphs and has no structured data without real entries', () => {
    const { container } = render(<Faq items={[items[1]!]} />);
    expect(graphOf(container)).toBeUndefined();
    const two = render(<Faq items={[items[0]!]} jsonLd={false} />);
    expect(two.container.querySelectorAll('details p')).toHaveLength(2);
    expect(graphOf(two.container)).toBeUndefined();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Faq items={[items[0]!]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
