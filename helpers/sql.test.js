const { sqlForPartialUpdate } = require("./sql");

describe("Testing SQL generator helper sqlForPartialUpdate", () => {
  test("Function returns proper sql when provided valid data", () => {
    const data = { firstName: "Henry", lastName: "Peters" };
    const jsToSql = { firstName: "first_name", lastName: "last_name" };

    const sql = sqlForPartialUpdate(data, jsToSql);

    expect(sql).toEqual({
      setCols: `"first_name"=$1, "last_name"=$2`,
      values: ["Henry", "Peters"],
    });
  });

  test("Function returns proper sql when provided non-string values", () => {
    const data = { firstName: "Henry", idNumber: 74673, isCeo: false };
    const jsToSql = {
      firstName: "first_name",
      idNumber: "id_number",
      isCeo: "is_ceo",
    };

    const sql = sqlForPartialUpdate(data, jsToSql);

    expect(sql).toEqual({
      setCols: `"first_name"=$1, "id_number"=$2, "is_ceo"=$3`,
      values: ["Henry", 74673, false],
    });
  });
});
