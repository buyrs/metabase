import { createAction } from "metabase/lib/redux";
import type {
  DashCardId,
  DashCardVisualizationSettings,
  Dashboard,
  DashboardCard,
  DashboardId,
} from "metabase-types/api";

export const INITIALIZE = "metabase/dashboard/INITIALIZE";
export const initialize = createAction(INITIALIZE);

export const RESET = "metabase/dashboard/RESET";
export const reset = createAction(RESET);

export const SET_EDITING_DASHBOARD = "metabase/dashboard/SET_EDITING_DASHBOARD";
export const setEditingDashboard = createAction<Dashboard | null>(
  SET_EDITING_DASHBOARD,
);

export type SetDashboardAttributesOpts = {
  id: DashboardId;
  attributes: Partial<Dashboard>;
};
export const SET_DASHBOARD_ATTRIBUTES =
  "metabase/dashboard/SET_DASHBOARD_ATTRIBUTES";
export const setDashboardAttributes = createAction<SetDashboardAttributesOpts>(
  SET_DASHBOARD_ATTRIBUTES,
);

export type SetDashCardAttributesOpts = {
  id: DashCardId;
  attributes: Partial<DashboardCard>;
};
export const SET_DASHCARD_ATTRIBUTES =
  "metabase/dashboard/SET_DASHCARD_ATTRIBUTES";
export const setDashCardAttributes = createAction<SetDashCardAttributesOpts>(
  SET_DASHCARD_ATTRIBUTES,
);

export type SetMultipleDashCardAttributesOpts = SetDashCardAttributesOpts[];
export const SET_MULTIPLE_DASHCARD_ATTRIBUTES =
  "metabase/dashboard/SET_MULTIPLE_DASHCARD_ATTRIBUTES";
export const setMultipleDashCardAttributes = createAction(
  SET_MULTIPLE_DASHCARD_ATTRIBUTES,
);

export const ADD_CARD_TO_DASH = "metabase/dashboard/ADD_CARD_TO_DASH";
export const ADD_MANY_CARDS_TO_DASH =
  "metabase/dashboard/ADD_MANY_CARDS_TO_DASH";

export const REMOVE_CARD_FROM_DASH = "metabase/dashboard/REMOVE_CARD_FROM_DASH";

export const UNDO_REMOVE_CARD_FROM_DASH =
  "metabase/dashboard/UNDO_REMOVE_CARD_FROM_DASH";

export const UPDATE_DASHCARD_VISUALIZATION_SETTINGS =
  "metabase/dashboard/UPDATE_DASHCARD_VISUALIZATION_SETTINGS";
export const onUpdateDashCardVisualizationSettings = createAction(
  UPDATE_DASHCARD_VISUALIZATION_SETTINGS,
  (id: DashCardId, settings: DashCardVisualizationSettings) => ({
    id,
    settings,
  }),
);

export const UPDATE_DASHCARD_VISUALIZATION_SETTINGS_FOR_COLUMN =
  "metabase/dashboard/UPDATE_DASHCARD_VISUALIZATION_SETTINGS_FOR_COLUMN";
export const onUpdateDashCardColumnSettings = createAction(
  UPDATE_DASHCARD_VISUALIZATION_SETTINGS_FOR_COLUMN,
  (
    id: DashCardId,
    column: string,
    settings?: Record<string, unknown> | null,
  ) => ({ id, column, settings }),
);

export const REPLACE_ALL_DASHCARD_VISUALIZATION_SETTINGS =
  "metabase/dashboard/REPLACE_ALL_DASHCARD_VISUALIZATION_SETTINGS";
export const onReplaceAllDashCardVisualizationSettings = createAction(
  REPLACE_ALL_DASHCARD_VISUALIZATION_SETTINGS,
  (id: DashCardId, settings: DashCardVisualizationSettings) => ({
    id,
    settings,
  }),
);
