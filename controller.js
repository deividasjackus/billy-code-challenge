"use strict";

const boom = require("@hapi/boom");

const db = require("./db");

module.exports = {
  getAvailabilityInfo: async (req, res) => {
    // Retrieve all batches from the database having at least 1 unit available
    const batches = await db
      .get("purchases")
      .filter(({ unitCount }) => unitCount > 0)
      .sortBy("date")
      .value();

    res.json({
      total: {
        unitCount: batches.map(({ unitCount }) => unitCount).reduce((a, b) => a + b, 0), // total number of units in stock
        value: batches.map(({ unitCost, unitCount }) => unitCost * unitCount).reduce((p, c) => p + c, 0), // aggregate value of units in stock
      },
      currentBatch: batches[0]
        ? {
            unitCost: batches[0].unitCost, // current unit price
            unitCount: batches[0].unitCount, // number of units available at given price
          }
        : null,
    });
  },

  addPurchase: async (req, res) => {
    const { date, unitCost, unitCount } = req.body;

    // TODO: input validation?

    // Ensure no record exists for given date
    const existingDoc = await db
      .get("purchases")
      .find({ date })
      .value();
    if (existingDoc) throw boom.conflict(`Record for date ${date} already exists`);

    const newDoc = {
      date,
      unitCost,
      unitCount,
      unitsSoldCount: 0,
      unitsSoldValue: 0,
    };

    // Add record to the database
    await db
      .get("purchases")
      .push(newDoc)
      .write();

    // Return the added record
    res.json(newDoc);
  },
  getPurchase: async (req, res) => {
    const { date } = req.params;

    // TODO: input validation?

    // Retrieve record from the database
    const existingDoc = await db
      .get("purchases")
      .find({ date })
      .value();
    if (!existingDoc) throw boom.notFound(`No record found for date ${date}`);

    res.json(existingDoc);
  },
  updatePurchase: async (req, res) => {
    const { date } = req.params;
    const { unitCount } = req.body;

    // TODO: input validation?

    // Retrieve record from the database
    const existingDoc = await db
      .get("purchases")
      .find({ date })
      .value();
    if (!existingDoc) throw boom.notFound(`No record found for date ${date}`);

    const newDoc = await db
      .get("purchases")
      .find({ date })
      .assign({ unitCount })
      .write();

    res.json(newDoc);
  },

  addSale: async (req, res) => {
    const { date, unitCount } = req.body;

    // TODO: input validation

    // Increment { unitsSoldCount, unitsSoldValue } for relevant purchase batch

    res.json("Add a new sale to the database.");
  },
  getSalesInfo: async (req, res) => {
    // TODO: input validation

    res.json("Retrieve information about recorded sales.");
  },
};
