// @flow

import React from 'react';
import Relay from 'react-relay/classic';

import FriendlyTime from '../../shared/FriendlyTime';
import JobState from '../../icons/JobState';
import JobTitle from '../../shared/JobTitle';
import Panel from '../../shared/Panel';

type Props = {
  job: {
    uuid: string,
    state: string,
    passed: boolean,
    scheduledAt: string,
    startedAt?: string,
    url: string
  }
};

class AgentJobRow extends React.PureComponent<Props> {
  render() {
    const job = this.props.job;

    return (
      <Panel.RowLink href={job.url}>
        <div className="flex regular line-height-3">
          <JobState.Small
            job={job}
            className="flex-none mr2"
          />
          <div className="flex-auto">
            <JobTitle className="block flex-auto" job={job} />
            <FriendlyTime
              className="flex-none dark-gray"
              value={job.startedAt || job.scheduledAt}
            />
          </div>
        </div>
      </Panel.RowLink>
    );
  }
}

export default Relay.createContainer(AgentJobRow, {
  fragments: {
    job: () => Relay.QL`
      fragment on JobTypeCommand {
        ${JobTitle.getFragment('job')}
        uuid
        state
        passed
        scheduledAt
        startedAt
        url
      }
    `
  }
});
