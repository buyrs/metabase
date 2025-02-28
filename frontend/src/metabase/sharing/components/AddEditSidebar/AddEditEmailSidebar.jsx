import PropTypes from "prop-types";
import { t } from "ttag";
import _ from "underscore";

import SendTestPulse from "metabase/components/SendTestPulse";
import SchedulePicker from "metabase/containers/SchedulePicker";
import Toggle from "metabase/core/components/Toggle";
import { Sidebar } from "metabase/dashboard/components/Sidebar";
import { dashboardPulseIsValid } from "metabase/lib/pulse";
import { PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE } from "metabase/plugins";
import RecipientPicker from "metabase/pulse/components/RecipientPicker";
import EmailAttachmentPicker from "metabase/sharing/components/EmailAttachmentPicker";
import { Icon } from "metabase/ui";

import { CaveatMessage } from "./CaveatMessage";
import DefaultParametersSection from "./DefaultParametersSection";
import DeleteSubscriptionAction from "./DeleteSubscriptionAction";
import Heading from "./Heading";
import { CHANNEL_NOUN_PLURAL } from "./constants";

function _AddEditEmailSidebar({
  pulse,
  formInput,
  channel,
  channelSpec,
  users,
  parameters,
  dashboard,

  // form callbacks
  handleSave,
  onCancel,
  onChannelPropertyChange,
  onChannelScheduleChange,
  testPulse,
  toggleSkipIfEmpty,
  setPulse,
  handleArchive,
  setPulseParameters,
}) {
  const isValid = dashboardPulseIsValid(pulse, formInput.channels);

  return (
    <Sidebar
      isCloseDisabled={!isValid}
      onClose={handleSave}
      onCancel={onCancel}
    >
      <div className="pt4 px4 flex align-center">
        <Icon name="mail" className="mr1" size={21} />
        <Heading>{t`Email this dashboard`}</Heading>
      </div>
      <CaveatMessage />
      <div className="my2 px4 full-height flex flex-column">
        <div>
          <div className="text-bold mb1">{t`To:`}</div>
          <RecipientPicker
            isNewPulse={pulse.id == null}
            autoFocus={false}
            recipients={channel.recipients}
            recipientTypes={channelSpec.recipients}
            users={users}
            onRecipientsChange={recipients =>
              onChannelPropertyChange("recipients", recipients)
            }
            invalidRecipientText={domains =>
              t`You're only allowed to email subscriptions to addresses ending in ${domains}`
            }
          />
        </div>
        <SchedulePicker
          schedule={_.pick(
            channel,
            "schedule_day",
            "schedule_frame",
            "schedule_hour",
            "schedule_type",
          )}
          scheduleOptions={channelSpec.schedules}
          textBeforeInterval={t`Sent`}
          textBeforeSendTime={t`${
            CHANNEL_NOUN_PLURAL[channelSpec && channelSpec.type] || t`Messages`
          } will be sent at`}
          onScheduleChange={(newSchedule, changedProp) =>
            onChannelScheduleChange(newSchedule, changedProp)
          }
        />
        <div className="pt2 pb1">
          <SendTestPulse
            channel={channel}
            channelSpecs={formInput.channels}
            pulse={pulse}
            testPulse={testPulse}
            normalText={t`Send email now`}
            successText={t`Email sent`}
            disabled={!isValid}
          />
        </div>
        {PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE.Component ? (
          <PLUGIN_DASHBOARD_SUBSCRIPTION_PARAMETERS_SECTION_OVERRIDE.Component
            className="py3 mt2 border-top"
            parameters={parameters}
            dashboard={dashboard}
            pulse={pulse}
            setPulseParameters={setPulseParameters}
          />
        ) : (
          <DefaultParametersSection
            className="py3 mt2 border-top"
            parameters={parameters}
          />
        )}
        <div className="text-bold py3 flex justify-between align-center border-top">
          <Heading>{t`Don't send if there aren't results`}</Heading>
          <Toggle
            value={pulse.skip_if_empty || false}
            onChange={toggleSkipIfEmpty}
          />
        </div>
        <div className="text-bold py2 flex justify-between align-center border-top">
          <div className="flex align-center">
            <Heading>{t`Attach results`}</Heading>
            <Icon
              name="info"
              className="text-medium ml1"
              size={12}
              tooltip={t`Attachments can contain up to 2,000 rows of data.`}
            />
          </div>
        </div>
        <EmailAttachmentPicker
          cards={pulse.cards}
          pulse={pulse}
          setPulse={setPulse}
        />
        {pulse.id != null && (
          <DeleteSubscriptionAction
            pulse={pulse}
            handleArchive={handleArchive}
          />
        )}
        <div className="p2 mt-auto text-small text-medium">
          {t`Charts in subscriptions may look slightly different from charts in dashboards.`}
        </div>
      </div>
    </Sidebar>
  );
}

_AddEditEmailSidebar.propTypes = {
  pulse: PropTypes.object,
  formInput: PropTypes.object.isRequired,
  channel: PropTypes.object.isRequired,
  channelSpec: PropTypes.object.isRequired,
  users: PropTypes.array,
  parameters: PropTypes.array.isRequired,
  dashboard: PropTypes.object.isRequired,
  handleSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onChannelPropertyChange: PropTypes.func.isRequired,
  onChannelScheduleChange: PropTypes.func.isRequired,
  testPulse: PropTypes.func.isRequired,
  toggleSkipIfEmpty: PropTypes.func.isRequired,
  setPulse: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
  setPulseParameters: PropTypes.func.isRequired,
};

export default _AddEditEmailSidebar;
