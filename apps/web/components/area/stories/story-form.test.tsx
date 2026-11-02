import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { STORY_MAX_CRITERIA } from '@josecoded/types';

import { StoryForm } from './story-form';

const labels = {
  form: 'Propose a story',
  title: 'Title',
  titleHelp: 'Short name',
  asA: 'As a…',
  asHelp: 'Who you are',
  iWant: 'I want…',
  wantHelp: 'What you want',
  soThat: 'So that…',
  soHelp: 'What for',
  criteriaLegend: 'Acceptance criteria',
  criteriaHelp: 'Optional, up to {max}.',
  criterion: 'Criterion {n}',
  remove: 'Remove criterion {n}',
  removeShort: 'Remove',
  add: 'Add criterion',
  max: 'Maximum of {max} reached.',
  added: 'Criterion {n} added. {count} of {max}.',
  removed: 'Criterion {n} removed. {count} of {max}.',
  submit: 'Send story',
  sent: 'Sent.',
};
const action = vi.fn(async () => ({ status: 'ok' as const }));
const view = () => render(<StoryForm action={action} locale="en" labels={labels} />);

describe('StoryForm', () => {
  it('starts with two criteria, no violations, and every control labelled', async () => {
    const { container } = view();
    expect(screen.getAllByRole('textbox', { name: /^Criterion/ })).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds a criterion, focuses it and announces it', async () => {
    view();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add criterion' })));
    const inputs = screen.getAllByRole('textbox', { name: /^Criterion/ });
    expect(inputs).toHaveLength(3);
    expect(document.activeElement).toBe(inputs[2]);
    expect(screen.getByText('Criterion 3 added. 3 of 12.')).toBeTruthy();
  });

  it('removes by number, focuses the one that took its place and renumbers', async () => {
    view();
    const inputs = () => screen.getAllByRole('textbox', { name: /^Criterion/ });
    fireEvent.change(inputs()[1]!, { target: { value: 'second' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove criterion 1' })));
    expect(inputs()).toHaveLength(1);
    expect((inputs()[0] as HTMLInputElement).value).toBe('second');
    expect(document.activeElement).toBe(inputs()[0]);
    expect(screen.getByText('Criterion 1 removed. 1 of 12.')).toBeTruthy();
  });

  it('sends the focus to «Add» when the last criterion goes, and stops offering it at the maximum', async () => {
    view();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove criterion 2' })));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove criterion 1' })));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add criterion' }));
    for (let i = 0; i < STORY_MAX_CRITERIA; i += 1) {
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add criterion' })));
    }
    expect(screen.getAllByRole('textbox', { name: /^Criterion/ })).toHaveLength(STORY_MAX_CRITERIA);
    expect(screen.queryByRole('button', { name: 'Add criterion' })).toBeNull();
    expect(screen.getByText('Maximum of 12 reached.')).toBeTruthy();
  });
});
