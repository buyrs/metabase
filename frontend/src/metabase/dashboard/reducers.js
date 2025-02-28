import { assoc, dissoc, assocIn, updateIn, chain, merge } from "icepick";
import produce from "immer";
import reduceReducers from "reduce-reducers";
import _ from "underscore";

import Actions from "metabase/entities/actions";
import Dashboards from "metabase/entities/dashboards";
import Questions from "metabase/entities/questions";
import { handleActions, combineReducers } from "metabase/lib/redux";
import { NAVIGATE_BACK_TO_DASHBOARD } from "metabase/query_builder/actions";

import {
  INITIALIZE,
  SET_EDITING_DASHBOARD,
  SET_DASHBOARD_ATTRIBUTES,
  ADD_CARD_TO_DASH,
  ADD_MANY_CARDS_TO_DASH,
  CREATE_PUBLIC_LINK,
  DELETE_PUBLIC_LINK,
  UPDATE_EMBEDDING_PARAMS,
  UPDATE_ENABLE_EMBEDDING,
  SET_DASHCARD_ATTRIBUTES,
  SET_MULTIPLE_DASHCARD_ATTRIBUTES,
  UPDATE_DASHCARD_VISUALIZATION_SETTINGS,
  UPDATE_DASHCARD_VISUALIZATION_SETTINGS_FOR_COLUMN,
  REPLACE_ALL_DASHCARD_VISUALIZATION_SETTINGS,
  REMOVE_CARD_FROM_DASH,
  MARK_NEW_CARD_SEEN,
  REMOVE_PARAMETER,
  FETCH_CARD_DATA,
  CLEAR_CARD_DATA,
  MARK_CARD_AS_SLOW,
  SET_PARAMETER_VALUE,
  FETCH_DASHBOARD_CARD_DATA,
  CANCEL_FETCH_CARD_DATA,
  SHOW_ADD_PARAMETER_POPOVER,
  HIDE_ADD_PARAMETER_POPOVER,
  SET_SIDEBAR,
  CLOSE_SIDEBAR,
  SET_DOCUMENT_TITLE,
  SET_SHOW_LOADING_COMPLETE_FAVICON,
  RESET,
  SET_PARAMETER_VALUES,
  UNDO_REMOVE_CARD_FROM_DASH,
  SHOW_AUTO_APPLY_FILTERS_TOAST,
  tabsReducer,
  FETCH_CARD_DATA_PENDING,
  fetchDashboard,
} from "./actions";
import { INITIAL_DASHBOARD_STATE } from "./constants";
import {
  calculateDashCardRowAfterUndo,
  syncParametersAndEmbeddingParams,
} from "./utils";

const dashboardId = handleActions(
  {
    [INITIALIZE]: { next: state => null },
    [fetchDashboard.fulfilled]: {
      next: (state, { payload }) => {
        return payload.dashboardId;
      },
    },
    [RESET]: { next: state => null },
  },
  INITIAL_DASHBOARD_STATE.dashboardId,
);

const editingDashboard = handleActions(
  {
    [INITIALIZE]: { next: () => INITIAL_DASHBOARD_STATE.editingDashboard },
    [SET_EDITING_DASHBOARD]: {
      next: (state, { payload }) => payload ?? null,
    },
    [RESET]: { next: () => INITIAL_DASHBOARD_STATE.editingDashboard },
  },
  INITIAL_DASHBOARD_STATE.editingDashboard,
);

const loadingControls = handleActions(
  {
    [SET_DOCUMENT_TITLE]: (state, { payload }) => ({
      ...state,
      documentTitle: payload,
    }),
    [SET_SHOW_LOADING_COMPLETE_FAVICON]: (state, { payload }) => ({
      ...state,
      showLoadCompleteFavicon: payload,
    }),
    [RESET]: { next: state => ({}) },
  },
  INITIAL_DASHBOARD_STATE.loadingControls,
);

function newDashboard(before, after, isDirty) {
  return {
    ...before,
    ...after,
    embedding_params: syncParametersAndEmbeddingParams(before, after),
    isDirty: isDirty ?? true,
  };
}

const dashboards = handleActions(
  {
    [fetchDashboard.fulfilled]: {
      next: (state, { payload }) => ({
        ...state,
        ...payload.entities.dashboard,
      }),
    },
    [SET_DASHBOARD_ATTRIBUTES]: {
      next: (state, { payload: { id, attributes, isDirty } }) => {
        return {
          ...state,
          [id]: newDashboard(state[id], attributes, isDirty),
        };
      },
    },
    [ADD_CARD_TO_DASH]: (state, { payload: dashcard }) => ({
      ...state,
      [dashcard.dashboard_id]: {
        ...state[dashcard.dashboard_id],
        dashcards: [...state[dashcard.dashboard_id].dashcards, dashcard.id],
      },
    }),
    [ADD_MANY_CARDS_TO_DASH]: (state, { payload: dashcards }) => {
      const [{ dashboard_id }] = dashcards;
      const dashcardIds = dashcards.map(({ id }) => id);
      return {
        ...state,
        [dashboard_id]: {
          ...state[dashboard_id],
          dashcards: [...state[dashboard_id].dashcards, ...dashcardIds],
        },
      };
    },
    [CREATE_PUBLIC_LINK]: {
      next: (state, { payload }) =>
        assocIn(state, [payload.id, "public_uuid"], payload.uuid),
    },
    [DELETE_PUBLIC_LINK]: {
      next: (state, { payload }) =>
        assocIn(state, [payload.id, "public_uuid"], null),
    },
    [UPDATE_EMBEDDING_PARAMS]: {
      next: (state, { payload }) =>
        assocIn(
          state,
          [payload.id, "embedding_params"],
          payload.embedding_params,
        ),
    },
    [UPDATE_ENABLE_EMBEDDING]: {
      next: (state, { payload }) =>
        produce(state, draftState => {
          const dashboard = draftState[payload.id];
          dashboard.enable_embedding = payload.enable_embedding;
          dashboard.initially_published_at = payload.initially_published_at;
        }),
    },
    [Dashboards.actionTypes.UPDATE]: {
      next: (state, { payload }) => {
        return produce(state, draftState => {
          const draftDashboard = draftState[payload.dashboard.id];
          if (draftDashboard) {
            draftDashboard.collection_id = payload.dashboard.collection_id;
            draftDashboard.collection = payload.dashboard.collection;
          }
        });
      },
    },
  },
  INITIAL_DASHBOARD_STATE.dashboards,
);

const dashcards = handleActions(
  {
    [fetchDashboard.fulfilled]: {
      next: (state, { payload }) => ({
        ...state,
        ...payload.entities.dashcard,
      }),
    },
    [SET_DASHCARD_ATTRIBUTES]: {
      next: (state, { payload: { id, attributes } }) => ({
        ...state,
        [id]: { ...state[id], ...attributes, isDirty: true },
      }),
    },
    [SET_MULTIPLE_DASHCARD_ATTRIBUTES]: {
      next: (state, { payload: { dashcards } }) => {
        const nextState = { ...state };
        dashcards.forEach(({ id, attributes }) => {
          nextState[id] = {
            ...state[id],
            ...attributes,
            isDirty: true,
          };
        });
        return nextState;
      },
    },
    [UPDATE_DASHCARD_VISUALIZATION_SETTINGS]: {
      next: (state, { payload: { id, settings } }) =>
        chain(state)
          .updateIn([id, "visualization_settings"], (value = {}) => ({
            ...value,
            ...settings,
          }))
          .assocIn([id, "isDirty"], true)
          .value(),
    },
    [UPDATE_DASHCARD_VISUALIZATION_SETTINGS_FOR_COLUMN]: {
      next: (state, { payload: { column, id, settings } }) =>
        chain(state)
          .updateIn([id, "visualization_settings"], (value = {}) =>
            updateIn(
              merge({ column_settings: {} }, value),
              ["column_settings", column],
              columnSettings => ({
                ...columnSettings,
                ...settings,
              }),
            ),
          )
          .assocIn([id, "isDirty"], true)
          .value(),
    },
    [REPLACE_ALL_DASHCARD_VISUALIZATION_SETTINGS]: {
      next: (state, { payload: { id, settings } }) =>
        chain(state)
          .assocIn([id, "visualization_settings"], settings)
          .assocIn([id, "isDirty"], true)
          .value(),
    },
    [ADD_CARD_TO_DASH]: (state, { payload: dashcard }) => ({
      ...state,
      [dashcard.id]: { ...dashcard, isAdded: true, justAdded: true },
    }),
    [ADD_MANY_CARDS_TO_DASH]: (state, { payload: dashcards }) => {
      const storeDashcards = dashcards.map(dc => ({
        ...dc,
        isAdded: true,
        justAdded: true,
      }));
      const storeDashCardsMap = _.indexBy(storeDashcards, "id");
      return {
        ...state,
        ...storeDashCardsMap,
      };
    },
    [REMOVE_CARD_FROM_DASH]: (state, { payload: { dashcardId } }) => ({
      ...state,
      [dashcardId]: { ...state[dashcardId], isRemoved: true },
    }),
    [UNDO_REMOVE_CARD_FROM_DASH]: (state, { payload: { dashcardId } }) => ({
      ...state,
      [dashcardId]: {
        ...state[dashcardId],
        isRemoved: false,
        row: calculateDashCardRowAfterUndo(state[dashcardId].row),
      },
    }),
    [MARK_NEW_CARD_SEEN]: (state, { payload: dashcardId }) => ({
      ...state,
      [dashcardId]: { ...state[dashcardId], justAdded: false },
    }),
    [Questions.actionTypes.UPDATE]: (state, { payload: { object: card } }) =>
      _.mapObject(state, dashcard =>
        dashcard.card?.id === card?.id
          ? assocIn(dashcard, ["card"], card)
          : dashcard,
      ),
    [Actions.actionTypes.UPDATE]: (state, { payload: { object: action } }) =>
      _.mapObject(state, dashcard =>
        dashcard.action?.id === action?.id
          ? {
              ...dashcard,
              action: {
                ...action,

                database_enabled_actions:
                  dashcard?.action.database_enabled_actions || false,
              },
            }
          : dashcard,
      ),
  },
  INITIAL_DASHBOARD_STATE.dashcards,
);

const isAddParameterPopoverOpen = handleActions(
  {
    [SHOW_ADD_PARAMETER_POPOVER]: () => true,
    [HIDE_ADD_PARAMETER_POPOVER]: () => false,
    [INITIALIZE]: () => false,
    [RESET]: () => false,
  },
  INITIAL_DASHBOARD_STATE.isAddParameterPopoverOpen,
);

const isNavigatingBackToDashboard = handleActions(
  {
    [NAVIGATE_BACK_TO_DASHBOARD]: () => true,
    [RESET]: () => false,
  },
  INITIAL_DASHBOARD_STATE.isNavigatingBackToDashboard,
);

// Many of these slices are also updated by `tabsReducer` in `frontend/src/metabase/dashboard/actions/tabs.ts`
const dashcardData = handleActions(
  {
    // clear existing dashboard data when loading a dashboard
    [INITIALIZE]: {
      next: (state, { payload: { clearCache = true } = {} }) =>
        clearCache ? {} : state,
    },
    [FETCH_CARD_DATA]: {
      next: (state, { payload: { dashcard_id, card_id, result } }) =>
        assocIn(state, [dashcard_id, card_id], result),
    },
    [CLEAR_CARD_DATA]: {
      next: (state, { payload: { cardId, dashcardId } }) =>
        assocIn(state, [dashcardId, cardId]),
    },
    [Questions.actionTypes.UPDATE]: (state, { payload: { object: card } }) =>
      _.mapObject(state, dashboardData => dissoc(dashboardData, card.id)),
  },
  INITIAL_DASHBOARD_STATE.dashcardData,
);

const slowCards = handleActions(
  {
    [MARK_CARD_AS_SLOW]: {
      next: (state, { payload: { id, result } }) => ({
        ...state,
        [id]: result,
      }),
    },
  },
  INITIAL_DASHBOARD_STATE.slowCards,
);

const parameterValues = handleActions(
  {
    [INITIALIZE]: {
      next: (state, { payload: { clearCache = true } = {} }) => {
        return clearCache ? {} : state;
      },
    },
    [fetchDashboard.fulfilled]: {
      next: (state, { payload: { parameterValues } }) => parameterValues,
    },
    [SET_PARAMETER_VALUE]: {
      next: (state, { payload: { id, value, isDraft } }) => {
        if (!isDraft) {
          return assoc(state, id, value);
        }

        return state;
      },
    },
    [SET_PARAMETER_VALUES]: {
      next: (state, { payload }) => payload,
    },
    [REMOVE_PARAMETER]: {
      next: (state, { payload: { id } }) => dissoc(state, id),
    },
  },
  INITIAL_DASHBOARD_STATE.parameterValues,
);

const draftParameterValues = handleActions(
  {
    [INITIALIZE]: {
      next: (state, { payload: { clearCache = true } = {} }) => {
        return clearCache ? {} : state;
      },
    },
    [fetchDashboard.fulfilled]: {
      next: (
        state,
        { payload: { dashboard, parameterValues, preserveParameters } },
      ) =>
        preserveParameters && !dashboard.auto_apply_filters
          ? state
          : parameterValues,
    },
    [SET_PARAMETER_VALUE]: {
      next: (state, { payload: { id, value } }) =>
        assoc(state ?? {}, id, value),
    },
    [SET_PARAMETER_VALUES]: {
      next: (state, { payload }) => payload,
    },
    [REMOVE_PARAMETER]: {
      next: (state, { payload: { id } }) => dissoc(state, id),
    },
  },
  {},
);

const loadingDashCards = handleActions(
  {
    [INITIALIZE]: {
      next: state => ({
        ...state,
        loadingStatus: "idle",
      }),
    },
    [FETCH_DASHBOARD_CARD_DATA]: {
      next: (state, { payload: { currentTime, loadingIds } }) => {
        return {
          ...state,
          loadingIds,
          loadingStatus: loadingIds.length > 0 ? "running" : "idle",
          startTime: loadingIds.length > 0 ? currentTime : null,
        };
      },
    },
    [FETCH_CARD_DATA_PENDING]: {
      next: (state, { payload: { dashcard_id } }) => {
        const loadingIds = !state.loadingIds.includes(dashcard_id)
          ? state.loadingIds.concat(dashcard_id)
          : state.loadingIds;
        return {
          ...state,
          loadingIds,
        };
      },
    },
    [FETCH_CARD_DATA]: {
      next: (state, { payload: { dashcard_id, currentTime } }) => {
        const loadingIds = state.loadingIds.filter(id => id !== dashcard_id);
        return {
          ...state,
          loadingIds,
          ...(loadingIds.length === 0
            ? { endTime: currentTime, loadingStatus: "complete" }
            : {}),
        };
      },
    },
    [CANCEL_FETCH_CARD_DATA]: {
      next: (state, { payload: { dashcard_id } }) => {
        const loadingIds = state.loadingIds.filter(id => id !== dashcard_id);
        return {
          ...state,
          loadingIds,
          ...(loadingIds.length === 0 ? { startTime: null } : {}),
        };
      },
    },
    [RESET]: {
      next: state => ({
        ...state,
        loadingStatus: "idle",
      }),
    },
  },
  INITIAL_DASHBOARD_STATE.loadingDashCards,
);

const DEFAULT_SIDEBAR = { props: {} };
const sidebar = handleActions(
  {
    [INITIALIZE]: {
      next: () => DEFAULT_SIDEBAR,
    },
    [SET_SIDEBAR]: {
      next: (state, { payload: { name, props } }) => ({
        name,
        props: props || {},
      }),
    },
    [CLOSE_SIDEBAR]: {
      next: () => DEFAULT_SIDEBAR,
    },
    [SET_EDITING_DASHBOARD]: {
      next: () => DEFAULT_SIDEBAR,
    },
    [REMOVE_PARAMETER]: {
      next: () => DEFAULT_SIDEBAR,
    },
    [RESET]: {
      next: () => DEFAULT_SIDEBAR,
    },
  },
  INITIAL_DASHBOARD_STATE.sidebar,
);

const missingActionParameters = handleActions(
  {
    [INITIALIZE]: {
      next: (state, payload) => null,
    },
    [RESET]: {
      next: (state, payload) => null,
    },
  },
  INITIAL_DASHBOARD_STATE.missingActionParameters,
);

export const autoApplyFilters = handleActions(
  {
    [SHOW_AUTO_APPLY_FILTERS_TOAST]: {
      next: (state, { payload: { toastId, dashboardId } }) => ({
        ...state,
        toastId,
        toastDashboardId: dashboardId,
      }),
    },
  },
  INITIAL_DASHBOARD_STATE.autoApplyFilters,
);

export const dashboardReducers = reduceReducers(
  INITIAL_DASHBOARD_STATE,
  combineReducers({
    dashboardId,
    editingDashboard,
    loadingControls,
    dashboards,
    dashcards,
    dashcardData,
    slowCards,
    parameterValues,
    draftParameterValues,
    loadingDashCards,
    isAddParameterPopoverOpen,
    isNavigatingBackToDashboard,
    sidebar,
    missingActionParameters,
    autoApplyFilters,
    // Combined reducer needs to init state for every slice
    selectedTabId: (state = INITIAL_DASHBOARD_STATE.selectedTabId) => state,
    tabDeletions: (state = INITIAL_DASHBOARD_STATE.tabDeletions) => state,
  }),
  tabsReducer,
);
