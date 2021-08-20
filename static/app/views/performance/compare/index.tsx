import * as React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/react';

import NotFound from 'app/components/errors/notFound';
import LightWeightNoProjectMessage from 'app/components/lightWeightNoProjectMessage';
import LoadingError from 'app/components/loadingError';
import LoadingIndicator from 'app/components/loadingIndicator';
import SentryDocumentTitle from 'app/components/sentryDocumentTitle';
import {t} from 'app/locale';
import {PageContent} from 'app/styles/organization';
import {Organization} from 'app/types';
import withOrganization from 'app/utils/withOrganization';

import TransactionComparisonContent from './content';
import FetchEvent, {ChildrenProps} from './fetchEvent';

type ComparedEventSlugs = {
  baselineEventSlug: string | undefined;
  regressionEventSlug: string | undefined;
};

type Props = RouteComponentProps<
  {baselineEventSlug: string; regressionEventSlug: string},
  {}
> & {
  organization: Organization;
};

class TransactionComparisonPage extends React.PureComponent<Props> {
  getEventSlugs(): ComparedEventSlugs {
    const {baselineEventSlug, regressionEventSlug} = this.props.params;

    const validatedBaselineEventSlug =
      typeof baselineEventSlug === 'string' ? baselineEventSlug.trim() : undefined;
    const validatedRegressionEventSlug =
      typeof regressionEventSlug === 'string' ? regressionEventSlug.trim() : undefined;

    return {
      baselineEventSlug: validatedBaselineEventSlug,
      regressionEventSlug: validatedRegressionEventSlug,
    };
  }

  fetchEvent(
    eventSlug: string | undefined,
    renderFunc: (props: ChildrenProps) => React.ReactNode
  ) {
    if (!eventSlug) {
      return <NotFound />;
    }

    const {organization} = this.props;

    return (
      <FetchEvent orgSlug={organization.slug} eventSlug={eventSlug}>
        {renderFunc}
      </FetchEvent>
    );
  }

  renderComparison({
    baselineEventSlug,
    regressionEventSlug,
  }: ComparedEventSlugs): React.ReactNode {
    return this.fetchEvent(baselineEventSlug, baselineEventResults => {
      return this.fetchEvent(regressionEventSlug, regressionEventResults => {
        if (baselineEventResults.isLoading || regressionEventResults.isLoading) {
          return <LoadingIndicator />;
        }

        if (baselineEventResults.error || regressionEventResults.error) {
          if (baselineEventResults.error) {
            Sentry.captureException(baselineEventResults.error);
          }

          if (regressionEventResults.error) {
            Sentry.captureException(regressionEventResults.error);
          }

          return <LoadingError />;
        }

        if (!baselineEventResults.event || !regressionEventResults.event) {
          return <NotFound />;
        }

        const {organization, location, params} = this.props;

        return (
          <TransactionComparisonContent
            organization={organization}
            location={location}
            params={params}
            baselineEvent={baselineEventResults.event}
            regressionEvent={regressionEventResults.event}
          />
        );
      });
    });
  }

  getDocumentTitle({baselineEventSlug, regressionEventSlug}: ComparedEventSlugs): string {
    if (
      typeof baselineEventSlug === 'string' &&
      typeof regressionEventSlug === 'string'
    ) {
      const title = t('Comparing %s to %s', baselineEventSlug, regressionEventSlug);

      return [title, t('Performance')].join(' - ');
    }

    return [t('Transaction Comparison'), t('Performance')].join(' - ');
  }

  render() {
    const {organization} = this.props;
    const {baselineEventSlug, regressionEventSlug} = this.getEventSlugs();

    return (
      <SentryDocumentTitle
        title={this.getDocumentTitle({baselineEventSlug, regressionEventSlug})}
        orgSlug={organization.slug}
      >
        <React.Fragment>
          <StyledPageContent>
            <LightWeightNoProjectMessage organization={organization}>
              {this.renderComparison({baselineEventSlug, regressionEventSlug})}
            </LightWeightNoProjectMessage>
          </StyledPageContent>
        </React.Fragment>
      </SentryDocumentTitle>
    );
  }
}

const StyledPageContent = styled(PageContent)`
  padding: 0;
`;

export default withOrganization(TransactionComparisonPage);
