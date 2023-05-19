"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });
  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });
  await Company.create({
    handle: "c3",
    name: "C3",
    numEmployees: 3,
    description: "Desc3",
    logoUrl: "http://c3.img",
  });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: true,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  const job1 = await Job.create({
    title: "ai developer",
    salary: 97000,
    equity: "0",
    companyHandle: "c3",
  });
  const job2 = await Job.create({
    title: "data engineer",
    salary: 175000,
    equity: "0.56",
    companyHandle: "c1",
  });
  const job3 = await Job.create({
    title: "data analyst",
    salary: 56000,
    equity: "0.74",
    companyHandle: "c1",
  });
  const job4 = await Job.create({
    title: "tax accountant",
    salary: 83500,
    equity: "0.47",
    companyHandle: "c2",
  });
  const job5 = await Job.create({
    title: "environmental consultant",
    salary: 48000,
    equity: null,
    companyHandle: "c3",
  });

  return [job1.id, job2.id, job3.id, job4.id, job5.id];
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1TokenAdmin = createToken({ username: "u1", isAdmin: true });
const u2Token = createToken({ username: "u2", isAdmin: false });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1TokenAdmin,
  u2Token,
};