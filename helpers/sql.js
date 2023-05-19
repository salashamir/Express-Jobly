const { BadRequestError } = require("../expressError");

/* Helper function for companies and user models to update object instances

Args: data object as first arg dataToUpdate which could take form: { firstName, lastName, password, email, isAdmin }, only includes properties ot update

Second arg jsToSql contains sql csnake cased column names for camelcased object js object properties

RETURNS obj with setCols, a string of sql for all the fields to update, and values, a list of the values the props should be updated to 
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // gets a list of the keys, checks that data ibject isnt empty
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // constructs sql string that will be inserted in update statement in User/Company model update method
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
