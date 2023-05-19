"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs or find filtered subset depending on search queries object passed in or not
   *
   * Filters set to empty object, optional, method will return all jobs if no filters
   *
   * title filter uses pattern matching, case insensitive
   * minSalary filter
   * hasEquity filter, if true provides non zero amount, if false lists all jobs
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...] or empty array if no matches found for filters {companies:[]}
   * */ 3;

  static async findAll(filters = {}) {
    const { title, minSalary, hasEquity } = filters;

    let rootQuery = `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`;

    const queryValues = [];
    const whereStatements = [];

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereStatements.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereStatements.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereStatements.push(`equity > 0`);
    }

    if (whereStatements.length > 0) {
      rootQuery += ` WHERE ${whereStatements.join(" AND ")}`;
    }

    rootQuery += `  ORDER BY title`;

    const jobsRes = await db.query(rootQuery, queryValues);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { job: {id, title, salary, equity, companyHandle} } or not found error
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job.id;
  }
}

module.exports = Job;
