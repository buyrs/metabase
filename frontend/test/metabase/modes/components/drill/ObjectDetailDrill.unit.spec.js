import ObjectDetailDrill from "metabase/modes/components/drill/ObjectDetailDrill";
import { ZOOM_IN_ROW } from "metabase/query_builder/actions";
import { ORDERS, PRODUCTS } from "__support__/sample_database_fixture";

const DEFAULT_CELL_VALUE = 1;

function setup({
  question = ORDERS.question(),
  column = ORDERS.ID.column(),
  value = DEFAULT_CELL_VALUE,
  rowIndex = 0,
} = {}) {
  const actions = ObjectDetailDrill({
    question,
    clicked: { column, value, origin: { rowIndex } },
  });
  return {
    actions,
    cellValue: value,
  };
}

describe("ObjectDetailDrill", () => {
  it("should not be valid for top level actions", () => {
    const actions = ObjectDetailDrill({ question: ORDERS.question() });
    expect(actions).toHaveLength(0);
  });

  it("should not be valid when clicked value is undefined", () => {
    const actions = ObjectDetailDrill({
      question: ORDERS.question(),
      clicked: {
        column: ORDERS.ID.column(),
        value: undefined,
      },
    });
    expect(actions).toHaveLength(0);
  });

  it("should not be valid non-PK cells", () => {
    const { actions: totalActions } = setup({
      column: ORDERS.TOTAL.column(),
    });
    const { actions: createdAtActions } = setup({
      column: ORDERS.CREATED_AT.column(),
    });
    expect(totalActions).toHaveLength(0);
    expect(createdAtActions).toHaveLength(0);
  });

  describe("PK cells", () => {
    const ROW_INDEX = 42;
    const { actions } = setup({
      column: ORDERS.ID.column(),
      rowIndex: ROW_INDEX,
    });

    it("should return object detail filter", () => {
      expect(actions).toMatchObject([{ name: "object-detail" }]);
    });

    it("should return correct redux action", () => {
      const [action] = actions;
      expect(action.action()).toEqual({
        type: ZOOM_IN_ROW,
        payload: {
          rowIndex: ROW_INDEX,
        },
      });
    });
  });

  describe("FK cells", () => {
    const { actions, cellValue } = setup({
      column: ORDERS.PRODUCT_ID.column(),
    });

    it("should return object detail filter", () => {
      expect(actions).toMatchObject([{ name: "object-detail" }]);
    });

    it("should apply object detail filter correctly", () => {
      const [action] = actions;
      const card = action.question().card();
      expect(card.dataset_query.query).toEqual({
        "source-table": PRODUCTS.id,
        filter: ["=", PRODUCTS.ID.reference(), cellValue],
      });
    });
  });
});
