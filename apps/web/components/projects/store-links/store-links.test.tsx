import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderIntl } from '@/tests/helpers/render-intl';

import { StoreLinks } from '.';

const labels = { appStore: 'Ver en la App Store', play: 'Ver en Google Play', web: 'Visitar la web', repo: 'Ver el código' };

describe('StoreLinks', () => {
  it('renders each proof as a link named for where it goes, and never a rating, install count or review count', () => {
    renderIntl(
      <StoreLinks
        groupLabel="Enlaces"
        labels={labels}
        links={[
          { kind: 'appStore', href: 'https://apps.apple.com/app/id1' },
          { kind: 'play', href: 'https://play.google.com/store/apps/details?id=x' },
          { kind: 'repo', href: 'https://github.com/x/y' },
        ]}
      />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: labels.appStore }).getAttribute('href')).toContain('apple.com');
    expect(screen.queryByText(/4,6|1\.200|valoraciones|descargas|ratings|installs/i)).toBeNull();
  });

  it('renders nothing when no proof exists yet', () => {
    const { container } = renderIntl(<StoreLinks groupLabel="Enlaces" labels={labels} links={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
