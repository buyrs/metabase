import { t } from "ttag";
import { isFK, isPK } from "metabase/lib/schema_metadata";
import { zoomInRow } from "metabase/query_builder/actions";

function findFKTargetField(question, column) {
  const field = question.metadata().field(column.id);
  if (!field) {
    return;
  }
  return field.target;
}

export default ({ question, clicked }) => {
  if (
    !clicked?.column ||
    clicked?.value === undefined ||
    !(isFK(clicked.column) || isPK(clicked.column))
  ) {
    return [];
  }

  const {
    column,
    origin: { rowIndex },
  } = clicked;

  const actionObject = {
    name: "object-detail",
    section: "details",
    title: t`View details`,
    buttonType: "horizontal",
    icon: "document",
    default: true,
  };

  if (isPK(column)) {
    actionObject.action = () => zoomInRow({ rowIndex });
  } else {
    const field = findFKTargetField(question, column);
    actionObject.question = () =>
      field ? question.drillPK(field, clicked.value) : question;
  }

  return [actionObject];
};
