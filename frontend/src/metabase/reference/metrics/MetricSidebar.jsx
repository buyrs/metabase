/* eslint "react/prop-types": "warn" */
import cx from "classnames";
import PropTypes from "prop-types";
import { memo } from "react";
import { t } from "ttag";

import Breadcrumbs from "metabase/components/Breadcrumbs";
import S from "metabase/components/Sidebar.module.css";
import SidebarItem from "metabase/components/SidebarItem";
import MetabaseSettings from "metabase/lib/settings";

const MetricSidebar = ({ metric, user, style, className }) => (
  <div className={cx(S.sidebar, className)} style={style}>
    <ul>
      <div className={S.breadcrumbs}>
        <Breadcrumbs
          className="py4 ml3"
          crumbs={[[t`Metrics`, "/reference/metrics"], [metric.name]]}
          inSidebar={true}
          placeholder={t`Data Reference`}
        />
      </div>
      <ol className="mx3">
        <SidebarItem
          key={`/reference/metrics/${metric.id}`}
          href={`/reference/metrics/${metric.id}`}
          icon="document"
          name={t`Details`}
        />
        <SidebarItem
          key={`/reference/metrics/${metric.id}/questions`}
          href={`/reference/metrics/${metric.id}/questions`}
          icon="folder"
          name={t`Questions about ${metric.name}`}
        />
        {MetabaseSettings.get("enable-xrays") && (
          <SidebarItem
            key={`/auto/dashboard/metric/${metric.id}`}
            href={`/auto/dashboard/metric/${metric.id}`}
            icon="bolt"
            name={t`X-ray this metric`}
          />
        )}
        {user && user.is_superuser && (
          <SidebarItem
            key={`/reference/metrics/${metric.id}/revisions`}
            href={`/reference/metrics/${metric.id}/revisions`}
            icon="history"
            name={t`Revision history for ${metric.name}`}
          />
        )}
      </ol>
    </ul>
  </div>
);

MetricSidebar.propTypes = {
  metric: PropTypes.object,
  user: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default memo(MetricSidebar);
