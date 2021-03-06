import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {createFragmentContainer} from 'react-relay'
import BottomNavControl from 'universal/components/BottomNavControl'
import BottomNavIconLabel from 'universal/components/BottomNavIconLabel'
import BounceBlock from 'universal/components/BounceBlock/BounceBlock'
import EditorHelpModalContainer from 'universal/containers/EditorHelpModalContainer/EditorHelpModalContainer'
import MeetingAgendaCards from 'universal/modules/meeting/components/MeetingAgendaCards/MeetingAgendaCards'
import MeetingFacilitationHint from 'universal/modules/meeting/components/MeetingFacilitationHint/MeetingFacilitationHint'
import MeetingMain from 'universal/modules/meeting/components/MeetingMain/MeetingMain'
import MeetingPrompt from 'universal/modules/meeting/components/MeetingPrompt/MeetingPrompt'
import MeetingSection from 'universal/modules/meeting/components/MeetingSection/MeetingSection'
import MeetingControlBar from 'universal/modules/meeting/components/MeetingControlBar/MeetingControlBar'
import actionMeeting from 'universal/modules/meeting/helpers/actionMeeting'
import {AGENDA_ITEMS} from 'universal/utils/constants'
import EndMeetingMutation from 'universal/mutations/EndMeetingMutation'
import withAtmosphere from 'universal/decorators/withAtmosphere/withAtmosphere'
import {withRouter} from 'react-router'
import styled from 'react-emotion'

const Layout = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  margin: '0 auto',
  maxWidth: '76rem',
  padding: '0 .75rem',
  width: '100%'
})

const Prompt = styled('div')({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center'
})

const Nav = styled('div')({
  paddingTop: '1rem',
  textAlign: 'center',
  width: '100%'
})

const TaskCardBlock = styled('div')({
  flex: 1,
  overflow: 'auto',
  padding: '.5rem .5rem 1.25rem',
  width: '100%'
})

const BottomControlSpacer = styled('div')({
  minWidth: '6rem'
})

const StyledBottomBar = styled(MeetingControlBar)({
  justifyContent: 'space-between'
})

class MeetingAgendaItems extends Component {
  state = {agendaTasks: []}

  componentWillMount () {
    this.makeAgendaTasks(this.props)
  }

  componentWillReceiveProps (nextProps) {
    const {
      viewer: {tasks: oldTasks},
      localPhaseItem: oldLocalPhaseItem
    } = this.props
    const {
      viewer: {tasks},
      localPhaseItem
    } = nextProps
    if (tasks !== oldTasks || localPhaseItem !== oldLocalPhaseItem) {
      this.makeAgendaTasks(nextProps)
    }
  }

  makeAgendaTasks (props) {
    const {
      localPhaseItem,
      viewer: {
        team: {agendaItems},
        tasks
      }
    } = props
    const agendaItem = agendaItems[localPhaseItem - 1]
    const agendaTasks = tasks.edges
      .map(({node}) => node)
      .filter((node) => node.agendaId === agendaItem.id)
      .sort((a, b) => (a.sortOrder < b.sortOrder ? 1 : -1))

    this.setState({
      agendaTasks
    })
  }

  render () {
    const {
      atmosphere,
      history,
      facilitatorName,
      gotoNext,
      hideMoveMeetingControls,
      localPhaseItem,
      showMoveMeetingControls,
      viewer: {team}
    } = this.props
    const {agendaTasks} = this.state
    const {agendaItems, id: teamId, teamMembers} = team
    const agendaItem = agendaItems[localPhaseItem - 1]
    const currentTeamMember = teamMembers.find((m) => m.id === agendaItem.teamMember.id)
    const subHeading = (
      <span>
        <b>{currentTeamMember.preferredName}</b>
        {', what do you need?'}
      </span>
    )
    const endMeeting = () => {
      EndMeetingMutation(atmosphere, teamId, history)
    }
    return (
      <MeetingMain hasHelpFor={AGENDA_ITEMS} isFacilitating={showMoveMeetingControls}>
        <MeetingSection flexToFill>
          <MeetingSection flexToFill>
            <Layout>
              <Prompt>
                <MeetingPrompt
                  avatar={currentTeamMember.picture}
                  heading={`“${agendaItem.content}”`}
                  subHeading={subHeading}
                />
              </Prompt>
              <Nav>
                {hideMoveMeetingControls && (
                  <MeetingFacilitationHint>
                    {'Waiting for'} <b>{facilitatorName}</b>{' '}
                    {`to wrap up the ${actionMeeting.agendaitems.name}`}
                  </MeetingFacilitationHint>
                )}
              </Nav>
              <TaskCardBlock>
                <MeetingAgendaCards
                  agendaId={agendaItem.id}
                  maxCols={4}
                  showPlaceholders
                  tasks={agendaTasks}
                  teamId={team.id}
                />
              </TaskCardBlock>
              <EditorHelpModalContainer />
            </Layout>
          </MeetingSection>
        </MeetingSection>
        {showMoveMeetingControls && (
          <StyledBottomBar>
            <BottomControlSpacer />
            <BounceBlock animationDelay='120s' key={`agendaItem${localPhaseItem}buttonAnimation`}>
              <BottomNavControl key={`agendaItem${localPhaseItem}`} onClick={gotoNext}>
                <BottomNavIconLabel icon='arrow_forward' iconColor='warm' label='Next Topic' />
              </BottomNavControl>
            </BounceBlock>
            <BottomNavControl onClick={endMeeting}>
              <BottomNavIconLabel icon='flag' iconColor='blue' label={'End Meeting'} />
            </BottomNavControl>
          </StyledBottomBar>
        )}
      </MeetingMain>
    )
  }
}

MeetingAgendaItems.propTypes = {
  atmosphere: PropTypes.object.isRequired,
  facilitatorName: PropTypes.string.isRequired,
  gotoNext: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  hideMoveMeetingControls: PropTypes.bool,
  localPhaseItem: PropTypes.number.isRequired,
  showMoveMeetingControls: PropTypes.bool,
  viewer: PropTypes.object
}

export default createFragmentContainer(
  withAtmosphere(withRouter(MeetingAgendaItems)),
  graphql`
    fragment MeetingAgendaItems_viewer on User {
      team(teamId: $teamId) {
        id
        agendaItems {
          id
          content
          teamMember {
            id
          }
        }
        teamMembers(sortBy: "checkInOrder") {
          id
          picture
          preferredName
        }
      }
      tasks(first: 1000, teamId: $teamId) @connection(key: "TeamColumnsContainer_tasks") {
        edges {
          node {
            id
            agendaId
            createdAt
            sortOrder
            ...NullableTask_task
          }
        }
      }
    }
  `
)
