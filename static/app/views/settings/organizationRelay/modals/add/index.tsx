import styled from '@emotion/styled';

import ExternalLink from 'app/components/links/externalLink';
import List from 'app/components/list';
import {t, tct} from 'app/locale';
import space from 'app/styles/space';

import ModalManager from '../modalManager';

import Item from './item';
import Terminal from './terminal';

class Add extends ModalManager {
  getTitle() {
    return t('Register Key');
  }

  getBtnSaveLabel() {
    return t('Register');
  }

  getData() {
    const {savedRelays} = this.props;
    const trustedRelays = [...savedRelays, this.state.values];

    return {trustedRelays};
  }

  getContent() {
    return (
      <StyledList symbol="colored-numeric">
        <Item
          title={tct('Initialize the configuration. [link: Learn how]', {
            link: (
              <ExternalLink href="https://docs.sentry.io/product/relay/getting-started/#initializing-configuration" />
            ),
          })}
          subtitle={t('Within your terminal:')}
        >
          <Terminal command="relay config init" />
        </Item>
        <Item
          title={tct(
            'Go to the file [jsonFile: credentials.json] to find the public key and enter it below.',
            {
              jsonFile: (
                <ExternalLink href="https://docs.sentry.io/product/relay/getting-started/#registering-relay-with-sentry" />
              ),
            }
          )}
        >
          {super.getForm()}
        </Item>
      </StyledList>
    );
  }
}

export default Add;

const StyledList = styled(List)`
  display: grid;
  grid-gap: ${space(3)};
`;
