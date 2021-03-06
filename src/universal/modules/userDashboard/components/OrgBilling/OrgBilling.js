import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {createPaginationContainer} from 'react-relay'
import RaisedButton from 'universal/components/RaisedButton'
import Panel from 'universal/components/Panel/Panel'
import InvoiceRow from 'universal/modules/userDashboard/components/InvoiceRow/InvoiceRow'
import appTheme from 'universal/styles/theme/appTheme'
import ui from 'universal/styles/ui'
import styled from 'react-emotion'
import LoadableModal from 'universal/components/LoadableModal'
import UpdateCreditCardLoadable from 'universal/components/UpdateCreditCardLoadable'
import Icon from 'universal/components/Icon'
import {MD_ICONS_SIZE_18} from 'universal/styles/icons'

const panelCell = {
  borderTop: `.0625rem solid ${ui.panelInnerBorderColor}`,
  padding: ui.panelGutter
}

const CreditCardInfo = styled('div')({
  alignItems: 'center',
  color: appTheme.palette.dark,
  display: 'flex',
  fontSize: appTheme.typography.s3,
  lineHeight: appTheme.typography.s5
})

const CreditCardIcon = styled(Icon)({
  fontSize: MD_ICONS_SIZE_18,
  marginRight: '1rem'
})

const EnvelopeIcon = styled(Icon)({
  fontSize: MD_ICONS_SIZE_18,
  marginLeft: '.24rem'
})

const CreditCardProvider = styled('span')({
  fontWeight: 600,
  marginRight: '.5rem'
})

const CreditCardNumber = styled('span')({
  marginRight: '2rem'
})

const CreditCardExpiresLabel = styled('span')({
  fontWeight: 600,
  marginRight: '.5rem'
})

const InfoAndUpdate = styled('div')({
  ...panelCell,
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between'
})

const MoreGutter = styled('div')({
  paddingBottom: ui.panelGutter
})

const LoadMoreButton = styled(RaisedButton)({
  margin: '0 auto'
})

const PanelRow = styled('div')({
  ...panelCell,
  textAlign: 'center'
})

const Unsubscribe = styled('div')({
  alignItems: 'center',
  color: appTheme.palette.mid,
  display: 'flex',
  justifyContent: 'center',
  '& a': {
    alignItems: 'center',
    color: appTheme.palette.mid,
    display: 'flex',
    marginLeft: '.5rem',
    '& > u': {
      textDecoration: 'none'
    },
    '&:hover > u, &:focus > u': {
      textDecoration: 'underline'
    }
  }
})

class OrgBilling extends Component {
  static propTypes = {
    invoices: PropTypes.array,
    invoicesReady: PropTypes.bool,
    organization: PropTypes.object,
    relay: PropTypes.object.isRequired,
    viewer: PropTypes.object
  }

  loadMore = () => {
    const {
      relay: {hasMore, isLoading, loadMore}
    } = this.props
    if (!hasMore() || isLoading()) return
    loadMore(5)
  }

  render () {
    const {
      organization,
      viewer: {invoices},
      relay: {hasMore}
    } = this.props
    const hasInvoices = invoices.edges.length > 0
    const {creditCard = {}, orgId} = organization
    const {brand = '???', last4 = '••••', expiry = '???'} = creditCard
    return (
      <div>
        <Panel label='Credit Card Information'>
          <InfoAndUpdate>
            <CreditCardInfo>
              <CreditCardIcon>credit_card</CreditCardIcon>
              <CreditCardProvider>{brand || '???'}</CreditCardProvider>
              <CreditCardNumber>
                {'•••• •••• •••• '}
                {last4 || '••••'}
              </CreditCardNumber>
              <CreditCardExpiresLabel>{'Expires'}</CreditCardExpiresLabel>
              <span>{expiry || '??/??'}</span>
            </CreditCardInfo>
            <LoadableModal
              LoadableComponent={UpdateCreditCardLoadable}
              maxWidth={350}
              maxHeight={225}
              queryVars={{orgId}}
              toggle={<RaisedButton>{'Update'}</RaisedButton>}
            />
          </InfoAndUpdate>
        </Panel>
        <Panel label='Invoices'>
          <div>
            {hasInvoices &&
              invoices.edges.map(({node: invoice}) => (
                <InvoiceRow
                  key={`invoiceRow${invoice.id}`}
                  invoice={invoice}
                  hasCard={Boolean(creditCard.last4)}
                />
              ))}
            {hasMore() && (
              <MoreGutter>
                <LoadMoreButton onClick={this.loadMore}>{'Load More'}</LoadMoreButton>
              </MoreGutter>
            )}
          </div>
        </Panel>
        <Panel label='Danger Zone'>
          <PanelRow>
            <Unsubscribe>
              <span>{'Need to cancel? It’s painless. '}</span>
              <a
                href='mailto:love@parabol.co?subject=Instant Unsubscribe from Pro'
                title='Instant Unsubscribe from Pro'
              >
                <u>{'Contact us'}</u>
                <EnvelopeIcon>email</EnvelopeIcon>
              </a>
            </Unsubscribe>
          </PanelRow>
        </Panel>
      </div>
    )
  }
}

export default createPaginationContainer(
  OrgBilling,
  graphql`
    fragment OrgBilling_viewer on User {
      invoices(first: $first, orgId: $orgId, after: $after)
        @connection(key: "OrgBilling_invoices") {
        edges {
          cursor
          node {
            id
            amountDue
            endAt
            paidAt
            startAt
            status
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  {
    direction: 'forward',
    getConnectionFromProps (props) {
      return props.viewer && props.viewer.invoices
    },
    getFragmentVariables (prevVars, totalCount) {
      return {
        ...prevVars,
        first: totalCount
      }
    },
    getVariables (props, {count, cursor}, fragmentVariables) {
      return {
        ...fragmentVariables,
        first: count,
        after: cursor
      }
    },
    query: graphql`
      query OrgBillingPaginationQuery($first: Int!, $after: DateTime, $orgId: ID!) {
        viewer {
          ...OrgBilling_viewer
        }
      }
    `
  }
)
