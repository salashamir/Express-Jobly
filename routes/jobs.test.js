"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1TokenAdmin,
  u2Token,
} = require("./_testCommon");

let jobIds = [];

beforeAll(async () => {
  jobIds.push(...(await commonBeforeAll()));
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "software developer",
    salary: 82000,
    equity: "0.8",
    companyHandle: "c1",
  };

  test("test works for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { id: expect.any(Number), ...newJob },
    });
  });

  test("test doesn't work for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        title: "carpenter apprentice",
        location: "Ohio",
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "50000",
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("test w/o filters returns all jobs", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "ai developer",
          salary: 97000,
          equity: "0",
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: "data analyst",
          salary: 56000,
          equity: "0.74",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "environmental consultant",
          salary: 48000,
          equity: null,
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: "tax accountant",
          salary: 83500,
          equity: "0.47",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("test with title filter", async function () {
    const resp = await request(app).get("/jobs").query({ title: "data" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "data analyst",
          salary: 56000,
          equity: "0.74",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test with minSalary filter", async function () {
    const resp = await request(app).get("/jobs").query({ minSalary: 95000 });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "ai developer",
          salary: 97000,
          equity: "0",
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test with hasEquity filter true", async function () {
    const resp = await request(app).get("/jobs").query({ hasEquity: "true" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "data analyst",
          salary: 56000,
          equity: "0.74",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "tax accountant",
          salary: 83500,
          equity: "0.47",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("test with hasEquity filter false", async function () {
    const resp = await request(app).get("/jobs").query({ hasEquity: "false" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "ai developer",
          salary: 97000,
          equity: "0",
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: "data analyst",
          salary: 56000,
          equity: "0.74",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "environmental consultant",
          salary: 48000,
          equity: null,
          companyHandle: "c3",
        },
        {
          id: expect.any(Number),
          title: "tax accountant",
          salary: 83500,
          equity: "0.47",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("test all filters", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "data", minSalary: 150000, hasEquity: "true" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "data engineer",
          salary: 175000,
          equity: "0.56",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test filtering should fail with invalid json schema", async function () {
    const resp = await request(app)
      .get("/companies")
      .query({ title: 9, subscribers: "45" });
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);

    const job = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );

    expect(resp.body).toEqual({ job: job.rows[0] });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "conservation biologist",
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);

    const job = await db.query(
      `SELECT id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );
    expect(resp.body).toEqual({
      job: {
        ...job.rows[0],
        title: "conservation biologist",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${jobIds[0]}`).send({
      title: "sportscaster",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "sportscaster",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such id", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "environmental analyst",
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        id: 847,
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        companyHandle: 53433,
      })
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const job = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id=$1`,
      [jobIds[0]]
    );

    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.body).toEqual({ deleted: job.rows[0].id });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${jobIds}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job id", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });
});
