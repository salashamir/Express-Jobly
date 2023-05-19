"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

const jobIds = [];

beforeAll(async () => {
  jobIds.push(...(await commonBeforeAll()));
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 234000,
    equity: "0.62",
    companyHandle: "c2",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({ id: expect.any(Number), ...newJob });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([newJob]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 1",
        salary: 79000,
        equity: "0.82",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Test Job 2",
        salary: 34000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Test Job 3",
        salary: 115000,
        equity: "0.75",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "Test Job 4",
        salary: null,
        equity: null,
        companyHandle: "c3",
      },
    ]);
  });

  test("works: title filter", async function () {
    let jobs = await Job.findAll({ title: "Job 2" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 2",
        salary: 34000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: minSalary filter", async function () {
    let jobs = await Job.findAll({ minSalary: 75000 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 1",
        salary: 79000,
        equity: "0.82",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Test Job 3",
        salary: 115000,
        equity: "0.75",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: hasEquity filter true", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 1",
        salary: 79000,
        equity: "0.82",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Test Job 3",
        salary: 115000,
        equity: "0.75",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: hasEquity filter false", async function () {
    let jobs = await Job.findAll({ hasEquity: false });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 1",
        salary: 79000,
        equity: "0.82",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Test Job 2",
        salary: 34000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Test Job 3",
        salary: 115000,
        equity: "0.75",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "Test Job 4",
        salary: null,
        equity: null,
        companyHandle: "c3",
      },
    ]);
  });

  test("works: all filters", async function () {
    let jobs = await Job.findAll({
      title: "Job",
      minSalary: 34000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Test Job 1",
        salary: 79000,
        equity: "0.82",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Test Job 3",
        salary: 115000,
        equity: "0.75",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: no results when not found", async function () {
    let jobs = await Job.findAll({
      title: "Bacon",
      minSalary: 200000,
      hasEquity: false,
    });
    expect(jobs).toEqual([]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const retrievedJob = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );

    let job = await Job.get(jobIds[0]);
    expect(job).toEqual({
      ...retrievedJob.rows[0],
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "marine biologist",
    salary: 48000,
    equity: "0.8",
  };

  test("works", async function () {
    let updatedJob = await Job.update(jobIds[0], updateData);
    const job = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );
    expect(updatedJob).toEqual({
      id: jobIds[0],
      ...updateData,
      companyHandle: job.rows[0].companyHandle,
    });
    expect(job.rows).toEqual([
      {
        ...updateData,
        companyHandle: expect.any(String),
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "marine biologist",
      salary: null,
      equity: null,
    };

    let updatedJob = await Job.update(jobIds[0], updateDataSetNulls);
    const job = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );

    expect(updatedJob).toEqual({
      id: jobIds[0],
      ...updateDataSetNulls,
      companyHandle: job.rows[0].companyHandle,
    });

    expect(job.rows).toEqual([
      {
        ...updateDataSetNulls,
        companyHandle: job.rows[0].companyHandle,
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobRemoved = await Job.remove(jobIds[0]);
    const res = await db.query("SELECT * FROM jobs WHERE id=$1", [jobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
