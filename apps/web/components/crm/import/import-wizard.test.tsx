import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import {
  previewImportAnalysis,
  previewImportResult,
  previewImportText,
} from '@/lib/dev/crm-fixtures';
import { renderIntl } from '@/tests/helpers/render-intl';

import { ImportWizard } from './import-wizard';

// the actions are public endpoints with their own tests; here only the screen is rendered
vi.mock('@/app/[locale]/(staff)/crm/importar/actions', () => ({
  previewImport: vi.fn(),
  importContacts: vi.fn(),
}));

const initial = {
  fileName: 'contactos.csv',
  text: previewImportText(),
  analysis: previewImportAnalysis(),
};

describe('ImportWizard', () => {
  it('step 1: the file input and the paste field are named, the current step is marked, axe is happy', async () => {
    const { container } = renderIntl(<ImportWizard locale="es" />);
    expect(screen.getByLabelText('Fichero CSV')).toBeTruthy();
    expect(screen.getByLabelText('O pega el texto')).toBeTruthy();
    expect(
      screen.getByRole('list', { name: 'Pasos' }).querySelector('[aria-current="step"]')
        ?.textContent,
    ).toBe('Fichero');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('step 2: each column has a named selector, the table a caption, and an invalid row points at its reason', async () => {
    const { container } = renderIntl(
      <ImportWizard locale="es" initial={{ step: 2, ...initial }} />,
    );
    expect(
      (screen.getByRole('combobox', { name: 'Campo para «E-mail»' }) as HTMLSelectElement).value,
    ).toBe('email');
    expect(
      (screen.getByRole('combobox', { name: 'Campo para «Fuente»' }) as HTMLSelectElement).value,
    ).toBe('');
    const preview = screen.getByRole('table', { name: /Primeras 20 de 30 filas/ });
    const bad = within(preview).getByRole('row', { name: /Carmen Ruiz/ });
    const reason = bad.getAttribute('aria-describedby');
    expect(reason).toBeTruthy();
    expect(document.getElementById(reason!)?.textContent).toContain(
      'Sin email, teléfono ni LinkedIn',
    );
    // a formula is shown as text, never as a link
    expect(screen.getByText('=HYPERLINK("http://x.test")').closest('a')).toBeNull();
    expect(screen.getByRole('button', { name: 'Importar 29 filas' })).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('step 2 without a name column says so and keeps the import off', () => {
    const analysis = previewImportAnalysis();
    const mapping = { ...analysis.mapping };
    delete mapping.display_name;
    renderIntl(
      <ImportWizard
        locale="es"
        initial={{ step: 2, ...initial, analysis: { ...analysis, mapping } }}
      />,
    );
    expect(screen.getByText(/Elige qué columna es el nombre/)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Importar 29 filas' }).getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('step 3: the result is a status that counts the rows waiting for the admin and says nothing else about them', async () => {
    const { container } = renderIntl(
      <ImportWizard locale="es" initial={{ step: 3, ...initial, result: previewImportResult() }} />,
    );
    const status = screen
      .getAllByRole('status')
      .find((node) => node.textContent?.includes('creados'));
    expect(status?.textContent).toContain('26 creados');
    expect(status?.textContent).toContain('1 pendiente de revisión del administrador');
    expect(status?.textContent).toContain('El administrador las revisará');
    expect(
      screen.getByRole('link', { name: 'Ver los 26 en Contactos' }).getAttribute('href'),
    ).toContain('/crm/contactos?import=');
    expect(await axe(container)).toHaveNoViolations();
  });
});
