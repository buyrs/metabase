/* eslint-disable react/prop-types */
import cx from "classnames";
import { Component } from "react";
import { t } from "ttag";

import LoadingSpinner from "metabase/components/LoadingSpinner";
import { HARD_ROW_LIMIT } from "metabase-lib/queries/utils";

import RunButtonWithTooltip from "./RunButtonWithTooltip";
import { VisualizationError } from "./VisualizationError";
import VisualizationResult from "./VisualizationResult";
import Warnings from "./Warnings";

export default class QueryVisualization extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  static defaultProps = {
    // NOTE: this should be more dynamic from the backend, it's set based on the query lang
    maxTableRows: HARD_ROW_LIMIT,
  };

  runQuery = () => {
    const { isResultDirty } = this.props;
    // ignore the cache if we're hitting "Refresh" (which we only show if isResultDirty = false)
    this.props.runQuestionQuery({ ignoreCache: !isResultDirty });
  };

  handleUpdateWarnings = warnings => {
    this.setState({ warnings });
  };

  render() {
    const {
      className,
      question,
      isRunning,
      isObjectDetail,
      isResultDirty,
      isNativeEditorOpen,
      result,
      loadingMessage,
    } = this.props;

    return (
      <div className={cx(className, "relative stacking-context full-height")}>
        {isRunning ? (
          <VisualizationRunningState
            className="spread z2"
            loadingMessage={loadingMessage}
          />
        ) : null}
        <VisualizationDirtyState
          {...this.props}
          hidden={!isResultDirty || isRunning || isNativeEditorOpen}
          className="spread z2"
        />
        {!isObjectDetail && (
          <Warnings
            warnings={this.state.warnings}
            className="absolute top right mt2 mr2 z2"
            size={18}
          />
        )}
        <div
          className={cx("spread Visualization z1", {
            "Visualization--loading": isRunning,
          })}
        >
          {result?.error ? (
            <VisualizationError
              className="spread"
              error={result.error}
              via={result.via}
              question={question}
              duration={result.duration}
            />
          ) : result?.data ? (
            <VisualizationResult
              {...this.props}
              className="spread"
              onUpdateWarnings={this.handleUpdateWarnings}
            />
          ) : !isRunning ? (
            <VisualizationEmptyState className="spread" />
          ) : null}
        </div>
      </div>
    );
  }
}

export const VisualizationEmptyState = ({ className }) => (
  <div className={cx(className, "flex flex-column layout-centered text-light")}>
    <h3>{t`Here's where your results will appear`}</h3>
  </div>
);

export const VisualizationRunningState = ({
  className = "",
  loadingMessage,
}) => (
  <div
    className={cx(
      className,
      "Loading flex flex-column layout-centered text-brand",
    )}
  >
    <LoadingSpinner />
    <h2 className="Loading-message text-brand text-uppercase my3">
      {loadingMessage}
    </h2>
  </div>
);

export const VisualizationDirtyState = ({
  className,
  result,
  isRunnable,
  isRunning,
  isResultDirty,
  runQuestionQuery,
  cancelQuery,
  hidden,
}) => (
  <div
    className={cx(className, "Loading flex flex-column layout-centered", {
      "Loading--hidden pointer-events-none": hidden,
    })}
  >
    <RunButtonWithTooltip
      className="py2 px3 shadowed"
      circular
      compact
      result={result}
      hidden={!isRunnable || hidden}
      isRunning={isRunning}
      isDirty={isResultDirty}
      onRun={() => runQuestionQuery({ ignoreCache: true })}
      onCancel={() => cancelQuery()}
    />
  </div>
);
