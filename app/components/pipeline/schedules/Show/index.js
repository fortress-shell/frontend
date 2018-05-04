import React from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import DocumentTitle from 'react-document-title';

import PipelineScheduleUpdateMutation from '../../../../mutations/PipelineScheduleUpdate';
import PipelineScheduleDeleteMutation from '../../../../mutations/PipelineScheduleDelete';

import Button from '../../../shared/Button';
import PageHeader from '../../../shared/PageHeader';
import Panel from '../../../shared/Panel';
import Emojify from '../../../shared/Emojify';
import FriendlyTime from '../../../shared/FriendlyTime';

import permissions from '../../../../lib/permissions';

import Build from './build';

class Show extends React.Component {
  static propTypes = {
    pipelineSchedule: PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      cronline: PropTypes.string.isRequired,
      label: PropTypes.string,
      commit: PropTypes.string,
      branch: PropTypes.string,
      message: PropTypes.string,
      env: PropTypes.arrayOf(PropTypes.string),
      enabled: PropTypes.bool.isRequired,
      failedMessage: PropTypes.string,
      failedAt: PropTypes.string,
      nextBuildAt: PropTypes.string,
      pipeline: PropTypes.shape({
        slug: PropTypes.string.isRequired,
        organization: PropTypes.shape({
          slug: PropTypes.string.isRequired
        }).isRequired
      }).isRequired,
      builds: PropTypes.shape({
        edges: PropTypes.arrayOf(
          PropTypes.shape({
            node: PropTypes.shape({
              id: PropTypes.string.isRequired
            }).isRequired
          }).isRequired
        )
      }).isRequired,
      createdBy: PropTypes.shape({
        name: PropTypes.string.isRequired
      }).isRequired,
      permissions: PropTypes.shape({
        pipelineScheduleUpdate: PropTypes.shape({
          allowed: PropTypes.bool.isRequired
        }).isRequired,
        pipelineScheduleDelete: PropTypes.shape({
          allowed: PropTypes.bool.isRequired
        }).isRequired
      }).isRequired
    })
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  state = {
    deleting: false,
    reEnabling: false
  }

  render() {
    const { pipelineSchedule } = this.props;
    // If the schedule doesn't exist, that means that it's just been deleted.
    // And since we require all the schedule to render this component, we'll
    // just short-circut the re-render when it's gone. This isn't great, maybe
    // there's a beter way?
    if (!pipelineSchedule) {
      return null;
    }

    return (
      <DocumentTitle title={pipelineSchedule.label || pipelineSchedule.cronline}>
        <div>
          <PageHeader>
            <PageHeader.Title>
              <Emojify
                text={pipelineSchedule.label || "No description"}
              />
            </PageHeader.Title>
            <PageHeader.Description>
              {pipelineSchedule.cronline}
            </PageHeader.Description>
            <PageHeader.Menu>
              {this.renderMenu()}
            </PageHeader.Menu>
          </PageHeader>

          {this.renderFailureMessage()}

          <Panel className="mb4">
            <Panel.Section>
              <div><strong>Message</strong></div>
              <div className="mb2 dark-gray">{pipelineSchedule.message || "Scheduled build"}</div>

              <div><strong>Created By</strong></div>
              <div className="mb2 dark-gray">{pipelineSchedule.createdBy.name}</div>

              <div><strong>Commit</strong></div>
              <div className="mb2 dark-gray"><code>{pipelineSchedule.commit}</code></div>

              <div><strong>Branch</strong></div>
              <div className="mb2 dark-gray">{pipelineSchedule.branch}</div>

              {this.renderEnv()}
            </Panel.Section>
          </Panel>

          <Panel>
            <Panel.Header>Recent Builds</Panel.Header>
            <Panel.Row>
              {this.renderRecentBuildsHeading()}
            </Panel.Row>
            {pipelineSchedule.builds.edges.map((edge) => (
              <Build
                key={edge.node.id}
                build={edge.node}
              />
            ))}
          </Panel>
        </div>
      </DocumentTitle>
    );
  }

  renderFailureMessage() {
    const { pipelineSchedule } = this.props;

    if (!pipelineSchedule.failedAt) {
      return null;
    }

    // NOTE: Currently the only `failedMessage` possible is "no longer has
    // access to create builds," so this formatting is built around that.
    return (
      <div className="mb4 p2 border border-red rounded red flex items-center">
        <span className="m1">
          This schedule was automatically disabled <FriendlyTime capitalized={false} value={pipelineSchedule.failedAt} /> because {pipelineSchedule.failedMessage}.
          If their access was restored, this schedule can be re-enabled.
        </span>
        {permissions(pipelineSchedule.permissions).check(
          {
            allowed: "pipelineScheduleUpdate",
            render: () => (
              <Button
                className="m1"
                theme="error"
                outline={true}
                loading={this.state.reEnabling ? "Re-Enabling…" : false}
                onClick={this.handleScheduleReEnableClick}
              >
                Re-Enable
              </Button>
            )
          }
        )}
      </div>
    );
  }

  renderRecentBuildsHeading() {
    const { pipelineSchedule } = this.props;

    if (!pipelineSchedule.enabled) {
      return (
        <span className="dark-gray py1">
          This pipeline schedule is currently disabled.
        </span>
      );
    }

    return (
      <React.Fragment>
        Next build scheduled for <FriendlyTime capitalized={false} value={pipelineSchedule.nextBuildAt} />
      </React.Fragment>
    );
  }

  renderEnv() {
    if (this.props.pipelineSchedule.env.length !== 0) {
      return (
        <div>
          <div><strong>Environment Variables</strong></div>
          <div className="mb2 dark-gray"><pre><code>{this.props.pipelineSchedule.env.join("\n")}</code></pre></div>
        </div>
      );
    }

    return null;
  }

  renderMenu() {
    return permissions(this.props.pipelineSchedule.permissions).collect(
      {
        allowed: "pipelineScheduleUpdate",
        render: (idx) => {
          const pipeline = this.props.pipelineSchedule.pipeline;
          const organization = this.props.pipelineSchedule.pipeline.organization;

          return (
            <PageHeader.Button
              key={idx}
              link={`/${organization.slug}/${pipeline.slug}/settings/schedules/${this.props.pipelineSchedule.uuid}/edit`}
            >
              Edit
            </PageHeader.Button>
          );
        }
      },
      {
        allowed: "pipelineScheduleDelete",
        render: (idx) => (
          <PageHeader.Button
            key={idx}
            loading={this.state.deleting ? "Deleting…" : false}
            onClick={this.handleScheduleDeleteClick}
          >
            Delete
          </PageHeader.Button>
        )
      }
    );
  }

  handleScheduleReEnableClick = () => {
    this.setState({ reEnabling: true });

    const mutation = new PipelineScheduleUpdateMutation({
      enabled: true,
      pipelineSchedule: this.props.pipelineSchedule
    });

    Relay.Store.commitUpdate(mutation, {
      onSuccess: this.handleUpdateMutationSuccess,
      onFailure: this.handleUpdateMutationFailure
    });
  }

  handleUpdateMutationSuccess = () => {
    this.setState({ reEnabling: false });
  }

  handleUpdateMutationFailure = (transaction) => {
    this.setState({ reEnabling: false });

    alert(transaction.getError());
  }

  handleScheduleDeleteClick = () => {
    if (confirm("Delete this schedule?")) {
      this.setState({ deleting: true });

      const mutation = new PipelineScheduleDeleteMutation({
        pipelineSchedule: this.props.pipelineSchedule
      });

      Relay.Store.commitUpdate(mutation, {
        onSuccess: this.handleDeleteMutationSuccess,
        onFailure: this.handleDeleteMutationFailure
      });
    }
  }

  handleDeleteMutationSuccess = () => {
    const pipeline = this.props.pipelineSchedule.pipeline;
    const organization = this.props.pipelineSchedule.pipeline.organization;

    this.context.router.push(`/${organization.slug}/${pipeline.slug}/settings/schedules`);
  }

  handleDeleteMutationFailure = (transaction) => {
    this.setState({ deleting: false });

    alert(transaction.getError());
  }
}

export default Relay.createContainer(Show, {
  fragments: {
    pipelineSchedule: () => Relay.QL`
      fragment on PipelineSchedule {
        ${PipelineScheduleUpdateMutation.getFragment('pipelineSchedule')}
        ${PipelineScheduleDeleteMutation.getFragment('pipelineSchedule')}
        uuid
        cronline
        label
        nextBuildAt
        commit
        branch
        message
        env
        enabled
        failedMessage
        failedAt
        createdBy {
          name
        }
        pipeline {
          slug
          organization {
            slug
          }
        }
        permissions {
          pipelineScheduleUpdate {
            allowed
          }
          pipelineScheduleDelete {
            allowed
          }
        }
        builds(first: 5) {
          edges {
            node {
              id
              ${Build.getFragment('build')}
            }
          }
        }
      }
    `
  }
});
